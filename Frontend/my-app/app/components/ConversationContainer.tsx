
"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";

interface Message {
  sender: "User" | "AI" | "Exam-AI";
  text: string;
}

interface ConversationContainerProps {
  showChat: boolean;
  onSendMessage: (addMessage: (message: Message) => void) => void;
  onAIResponse?: (response: string) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const ConversationContainer: React.FC<ConversationContainerProps> = ({ 
  showChat, 
  onSendMessage, 
  onAIResponse 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  // Initialize socket once
useEffect(() => {
  socketRef.current = io(BACKEND_URL, {
    path: "/socket.io/",
    transports: ["polling"], // Force polling only
    upgrade: false, // Explicitly disable WebSocket upgrade
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 30000,
  });

  const socket = socketRef.current;

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Socket connection error:", error.message, error.stack);
    console.log("Transport used:", socket.io.opts.transports);
  });

  socket.on("errorMessage", (data: { error: string }) => {
    console.error("Server error:", data.error);
    setIsTyping(false);
  });

  socket.on("receiveMessage", (newMessage: Message) => {
    console.log("📩 Received message from socket:", newMessage);

    setMessages((prev) => {
      const isDuplicate = prev.some(
        (msg) => msg.sender === newMessage.sender && msg.text === newMessage.text
      );
      if (isDuplicate) return prev;

      if (newMessage.sender === "Exam-AI" || newMessage.sender === "AI") {
        setIsTyping(true);
        const formattedLines = newMessage.text
          .replace(/\*/g, "")
          .replace(/\. /g, ".\n")
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "");

        if (onAIResponse) {
          formattedLines.forEach((line, index) => {
            setTimeout(() => {
              onAIResponse(line);
            }, index * 500);
          });
        }

        formattedLines.forEach((line, index) => {
          setTimeout(() => {
            setMessages((prevMessages) => {
              const lineExists = prevMessages.some(
                (msg) => msg.sender === newMessage.sender && msg.text === line
              );
              if (lineExists) return prevMessages;
              return [...prevMessages, { sender: newMessage.sender, text: line }];
            });
            if (index === formattedLines.length - 1) {
              setIsTyping(false);
            }
          }, index * 500);
        });
        return prev;
      }

      setIsTyping(false);
      return [...prev, newMessage];
    });
  });

  return () => {
    socket.disconnect();
    console.log("Socket disconnected");
  };
}, [onAIResponse]);

  // Create stable addMessage callback and notify parent
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
    
    // IMPORTANT: Backend expects { userId, message, mode } format
    // You need to extract userId and mode from somewhere (context, props, etc.)
    // For now, using placeholder - UPDATE THIS based on your app's auth/context
    if (socketRef.current) {
      socketRef.current.emit("sendMessage", {
        userId: "user_id_here", // TODO: Get from auth context/props
        message: message.text,
        mode: "chat", // TODO: Get actual mode (chat/exam/etc.)
      });
    }
  }, []);

  // Notify parent of addMessage function
  useEffect(() => {
    onSendMessage(addMessage);
  }, [onSendMessage, addMessage]);

  // Auto-scroll to latest message
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
                        className={`p-3 rounded-lg shadow-md flex justify-between flex-col gap-1 ${
                          isUser
                            ? "bg-pink-100 text-black text-right self-end"
                            : "bg-gray-300 text-black text-left self-start flex flex-col gap-1"
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