"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import plane from "@/public/images/plane.png";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import { useAuth } from "@clerk/nextjs";
import ConversationContainer from "./ConversationContainer";
import canvus from '@/public/images/canvus.png'
import WhiteCanvas from "./WhiteCanvas";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const options = ["Explain Topic", "Explore Questions", "Start a Test"];
const testOptions = ["From Existing Paper", "From Current Topic"]; // New options for "Start a Test"

interface Message {
  sender: "User" | "AI" | "Exam-AI";
  text: string;
}

const InputField: React.FC = () => {
  const { userId } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [showTestOptions, setShowTestOptions] = useState(false); // State for showing test options
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedTestOption, setSelectedTestOption] = useState(testOptions[0]); // State for selected test option
  const [showConversationBox, setShowConversationBox] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSend = async (addMessage: (message: Message) => void) => {
    if (!inputValue.trim() || !userId) return;

    setIsLoading(true);

    const userMessage: Message = {
      sender: "User",
      text: `${selectedOption}: ${inputValue}`,
    };

    if (selectedOption === "Start a Test") {
      // Show the test options dropdown instead of immediately redirecting
      setShowTestOptions(true);
      setIsLoading(false);
      return;
    }

    addMessage(userMessage);
    socket.emit("sendMessage", { userId, message: inputValue, mode: selectedOption });

    console.log("Sending API requests with:", { userId, message: inputValue, mode: selectedOption });

    try {
      const [chatResponse, historyResponse] = await Promise.all([
        fetch("http://localhost:5000/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, message: inputValue, mode: selectedOption }),
        }),
        fetch("http://localhost:5000/api/searchhistory/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, query: inputValue, option: selectedOption }),
        }),
      ]);

      const chatContentType = chatResponse.headers.get("content-type");
      if (!chatContentType || !chatContentType.includes("application/json")) {
        const rawText = await chatResponse.text();
        console.error("Chat API did not return JSON:", rawText);
        throw new Error("Invalid chat API response.");
      }

      const chatData = await chatResponse.json();

      if (!chatResponse.ok) {
        throw new Error(chatData.error || "Chat API error occurred.");
      }

      if (historyResponse.ok) {
        console.log("✅ Search history saved successfully.");
      } else {
        console.warn("⚠️ Failed to save search history.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage({ sender: "AI", text: `Error: ${error}` });
    } finally {
      setShowConversationBox(true);
      setInputValue("");
      setIsLoading(false);
    }
  };

  // Handle test option selection
  const handleTestOptionSelect = (option: string) => {
    setSelectedTestOption(option);
    setShowTestOptions(false);

    if (option === "From Current Topic") {
      router.push(`/test?topic=${encodeURIComponent(inputValue)}`);
    } else if (option === "From Existing Paper") {
      router.push(`/upload-question-paper?userId=${userId}`);
    }

    setInputValue("");
    setIsLoading(false);
  };

  return (
    <div className="w-full fixed bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 200 }}
        animate={{ opacity: 1, y: showConversationBox ? 450 : -250 }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
        className="w-2xl p-4 bg-white border border-gray-500 rounded-xl shadow-lg z-50"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter Your Topic ~"
            value={inputValue}
            className="w-full p-2 text-lg bg-transparent outline-none rounded-md text-black focus:border-gray-500 input-text tracking-wide transition"
            onChange={(e) => setInputValue(e.target.value)}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onKeyDown={(e) => e.key === "Enter" && handleSend((message) => {})}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between mt-3 relative">
          <div className="relative">
            <button
              className="p-2 text-lg font-bold text-black border border-gray-400 rounded-md shadow-md tracking-wider hover:bg-gray-100 explore transition"
              onClick={() => setShowOptions((prev) => !prev)}
              disabled={isLoading}
            >
              {selectedOption} ▲
            </button>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full mb-3 left-0 w-72 bg-white border border-black rounded-md shadow-lg flex items-center p-2 justify-center z-10"
                >
                  <div className="flex flex-col w-full gap-2">
                    {options.map((option) => (
                      <button
                        key={option}
                        className="w-full text-center p-2 text-lg font-bold text-black bg-pink-100 hover:bg-pink-200 border border-transparent hover:border-black rounded-md transition options"
                        onClick={() => {
                          setSelectedOption(option);
                          setShowOptions(false);
                          if (option !== "Start a Test") {
                            setShowTestOptions(false);
                          }
                        }}
                        disabled={isLoading}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <Image src={plane} alt="Sidebar Toggle" className="w-20 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Test Options Dropdown */}
            <AnimatePresence>
              {showTestOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full mb-16 left-0 w-72 bg-white border border-black rounded-md shadow-lg flex items-center p-2 justify-center z-10"
                >
                  <div className="flex flex-col w-full gap-2">
                    {testOptions.map((option) => (
                      <button
                        key={option}
                        className="w-full text-center p-2 text-lg font-bold text-black bg-blue-100 hover:bg-blue-200 border border-transparent hover:border-black rounded-md transition options"
                        onClick={() => handleTestOptionSelect(option)}
                        disabled={isLoading}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex justify-center items-center gap-4">          
            <button className="rounded-full border-1 border-black cursor-pointer" onClick={() => setShowCanvas(true)}>
          <Image src={canvus} alt="Canvus" className="w-10 p-2" />
          </button>

          <button
            className={`p-2 font-bold border rounded-md text-lg tracking-wide generate transition flex items-center justify-center ${
              inputValue.trim() && !isLoading
                ? "hover:bg-gray-300 cursor-pointer"
                : "text-gray-400 cursor-not-allowed"
            }`}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onClick={() => handleSend((message) => {})}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <motion.div
                className="flex gap-1"
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <div className="w-2 h-2 bg-black rounded-full"></div>
                <div className="w-2 h-2 bg-black rounded-full"></div>
                <div className="w-2 h-2 bg-black rounded-full"></div>
              </motion.div>
            ) : (
              "Generate"
            )}
          </button>
          </div>

        </div>
      </motion.div>

      <div className="w-full">
        <AnimatePresence>
          {showConversationBox && (
            <ConversationContainer showChat={showConversationBox} onSendMessage={handleSend} />
          )}
        </AnimatePresence>
      </div>
      <WhiteCanvas isOpen={showCanvas} onClose={() => setShowCanvas(false)} />
    </div>
  );
};

export default InputField;