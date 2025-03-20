"use client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router"; // Use next/router for Pages Router
import { motion } from "framer-motion";

const TestPage: React.FC = () => {
  const router = useRouter();
  const { topic } = router.query; // Get topic from query param
  const [testStarted, setTestStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  // Example questions (replace with real ones from an API or database if needed)
  const questions = [
    {
      question: `What is the basic concept of ${topic || "Unnamed Topic"}?`,
      options: ["A", "B", "C", "D"],
      answer: "A",
    },
    {
      question: `How does ${topic || "Unnamed Topic"} apply in real life?`,
      options: ["X", "Y", "Z", "W"],
      answer: "Y",
    },
  ];

  const handleStartTest = () => {
    setTestStarted(true);
  };

  const handleNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      alert("Test completed!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Test on {topic ? decodeURIComponent(topic as string) : "Unnamed Topic"}
        </h1>

        {!testStarted ? (
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-6">
              Get ready to test your knowledge on{" "}
              {topic ? decodeURIComponent(topic as string) : "Unnamed Topic"}!
            </p>
            <button
              onClick={handleStartTest}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-300"
            >
              Start Test
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Question {questionIndex + 1} of {questions.length}
            </h2>
            <p className="text-lg text-gray-600 mb-4">{questions[questionIndex].question}</p>
            <div className="grid grid-cols-2 gap-4">
              {questions[questionIndex].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => alert(`Selected: ${option}`)} // Replace with actual answer checking logic
                  className="p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200 text-gray-800"
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition duration-300"
              >
                {questionIndex < questions.length - 1 ? "Next Question" : "Finish Test"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TestPage;