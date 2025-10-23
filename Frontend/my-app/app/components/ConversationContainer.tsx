"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";

interface Message {
  sender: "User" | "AI" | "Exam-AI";
  text: string;
}

interface ConversationContainerProps {
  showChat: boolean;
  onSendMessage: (addMessage: (message: Message) => void) => void;
  onAIResponse?: (response: string) => void; // New prop to pass AI response
}
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const socket = io(BACKEND_URL);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ConversationContainer: React.FC<ConversationContainerProps> = ({ showChat, onSendMessage, onAIResponse }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  useEffect(() => {
    if (!socket) return;

    socket.off("receiveMessage"); // Prevent duplicate listeners
    socket.on("receiveMessage", (newMessage: Message) => {
      console.log("📩 Received message from socket:", newMessage);

      setMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) => msg.sender === newMessage.sender && msg.text === newMessage.text
        );
        if (isDuplicate) return prev;

        if (newMessage.sender === "Exam-AI" || newMessage.sender === "AI") {
          const formattedLines = newMessage.text
            .replace(/\*/g, "")
            .replace(/\. /g, ".\n")
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "");

          // Speak each line with a delay to match the display
          if (onAIResponse) {
            formattedLines.forEach((line, index) => {
              setTimeout(() => {
                onAIResponse(line); // Pass each line to InputField.tsx to be spoken
              }, index * 500);
            });
          }

          // Display each line with a delay
          formattedLines.forEach((line, index) => {
            setTimeout(() => {
              setMessages((prev) => {
                const lineExists = prev.some(
                  (msg) => msg.sender === newMessage.sender && msg.text === line
                );
                if (lineExists) return prev;
                return [...prev, { sender: newMessage.sender, text: line }];
              });
            }, index * 500);
          });
          return prev;
        }

        return [...prev, newMessage];
      });
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [onAIResponse]); // Add onAIResponse to dependencies

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  return (
    <AnimatePresence>
      {showChat && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -110 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col w-full p-4 bg-transparent h-[60vh] overflow-y-auto scroll-container rounded-lg -z-30"
        >
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">Loading conversation...</p>
          ) : (
            <div className="flex flex-col gap-2 text-black">
              <AnimatePresence>
                {messages.map((msg, index) => {
                  const isUser = msg.sender === "User";
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: isUser ? 50 : -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isUser ? 50 : -50 }}
                      transition={{ type: "spring", stiffness: 100, damping: 10 }}
                      className={`flex flex-col max-w-[80%] ${
                        isUser ? "self-end items-end" : "self-start items-start"
                      }`}
                    >
                      <span className="text-xs font-semibold text-gray-500">{msg.sender}</span>
                      <div
                        className={`p-3 rounded-lg shadow-md flex justify-between flex-col gap-1${
                          isUser
                            ? " bg-pink-100 text-black text-right self-end"
                            : " bg-gray-300 text-black text-left self-start flex flex-col gap-1"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {isTyping && (
                <div className="text-gray-500 text-sm flex items-center">
                  Bot is typing<span className="animate-pulse">...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConversationContainer;