"use client";
import React, { useState, useEffect, useRef } from "react";
import { useUser, SignedIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Mic, Send } from "@deemlol/next-icons"; // Assuming you have icons for the mic and send buttons

const SpeechChat: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null); // Reference for SpeechRecognition
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("Speech Recognition is not supported in this browser. Please use a modern browser like Chrome.");
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError("Error with speech recognition: " + event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!user?.id) {
      setError("User ID is not available. Please log in.");
      return;
    }

    const newMessage = { sender: "User", text: inputText };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, message: inputText, mode: "chat" }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to send message");
      }

      const data = await response.json();
      const aiMessage = { sender: "Exam-AI", text: data.answer };
      setMessages((prev) => [...prev, aiMessage]);

      // Speak the AI's response
      speakText(data.answer);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to get AI response. Please try again.");
      setMessages((prev) => [...prev, { sender: "Exam-AI", text: "Sorry, I couldn't process your request." }]);
    }
  };

  // Handle speech input
  const handleSpeechInput = () => {
    if (!recognitionRef.current) {
      setError("Speech Recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Handle text-to-speech
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setError("Error with speech synthesis: " + event.error);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setError("Speech Synthesis is not supported in this browser.");
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <SignedIn>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 flex flex-col h-[80vh]">
          <header className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Speech Chat with Examina AI</h1>
            <button onClick={() => router.push("/")} className="text-gray-600">
              Back
            </button>
          </header>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded-lg ${
                  msg.sender === "User" ? "bg-blue-100 ml-auto" : "bg-green-100 mr-auto"
                } max-w-[80%]`}
              >
                <span className="font-semibold">{msg.sender}:</span> {msg.text}
              </div>
            ))}
            {isSpeaking && (
              <div className="text-gray-500 italic">AI is speaking...</div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 mb-2">{error}</div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask a question..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSpeechInput}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                  isListening ? "bg-red-500" : "bg-blue-500"
                } text-white`}
              >
                <Mic size={24} />
              </button>
            </div>
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Send size={24} />
            </button>
          </form>
        </div>
      </div>
    </SignedIn>
  );
};

export default SpeechChat;