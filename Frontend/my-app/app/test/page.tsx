"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, SignedIn } from "@clerk/nextjs"; // Import SignedIn
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from "framer-motion";
import { ArrowLeft } from "@deemlol/next-icons";

const TestPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const topic = searchParams.get("topic") || "Unnamed Topic";
  const paperId = searchParams.get("paperId") || null;
  const [testStarted, setTestStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [timerOption, setTimerOption] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let url = `${BACKEND_URL}/api/questions`;
        if (paperId) {
          url += `?paperId=${paperId}&questionCount=30`;
        } else if (topic) {
          url += `?topic=${encodeURIComponent(topic)}&questionCount=30`;
        }

        console.log("Fetching questions from:", url);
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || "Failed to fetch questions");
        }

        const data = await response.json();
        setQuestions(data.questions || []);
        setUserAnswers(new Array(data.questions.length).fill(null));
      } catch (error) {
        console.error("Error fetching questions:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An error occurred while fetching questions.");
        }
        if (paperId) {
          setQuestions([
            {
              question: "What is the capital of France?",
              options: ["A) Paris", "B) London", "C) Berlin", "D) Madrid"],
              answer: "A) Paris",
            },
            {
              question: "What is 2 + 2?",
              options: ["A) 3", "B) 4", "C) 5", "D) 6"],
              answer: "B) 4",
            },
          ]);
        } else {
          setQuestions([
            {
              question: `Which of the following is NOT a feature of ${topic}?`,
              options: [
                "A) Built-in development server",
                "B) ORM (Object-Relational Mapping) support by default",
                "C) Jinja2 templating engine",
                "D) Lightweight and modular design",
              ],
              answer: "B) ORM (Object-Relational Mapping) support by default",
            },
            {
              question: `What is a key benefit of ${topic}?`,
              options: ["A) Speed", "B) Complexity", "C) Heavyweight", "D) Inflexibility"],
              answer: "A) Speed",
            },
          ]);
        }
        setUserAnswers(new Array(questions.length).fill(null));
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [BACKEND_URL, paperId, questions.length, topic]);

  const handleStartTest = (minutes: number) => {
    const questionCount = minutes === 5 ? 15 : 30;
    setTimerOption(minutes * 60);
    setTimer(minutes * 60);
    setTestStarted(true);

    if (questions.length < questionCount) {
      const additionalQuestions = Array.from({ length: questionCount - questions.length }, (_, i) => ({
        question: `Placeholder Question ${i + questions.length + 1} for ${topic}`,
        options: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        answer: "A) Option 1",
      }));
      setQuestions([...questions, ...additionalQuestions]);
      setUserAnswers(new Array(questionCount).fill(null));
    } else if (questions.length > questionCount) {
      setQuestions(questions.slice(0, questionCount));
      setUserAnswers(new Array(questionCount).fill(null));
    }
  };

  useEffect(() => {
    if (!testStarted || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          saveTestResult();
          alert("Time's up! Test completed.");
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testStarted, timer, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    const newUserAnswers = [...userAnswers];
    newUserAnswers[questionIndex] = option;
    setUserAnswers(newUserAnswers);

    if (option === questions[questionIndex].answer) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleMarkForReview = () => {
    if (!markedForReview.includes(questionIndex)) {
      setMarkedForReview([...markedForReview, questionIndex]);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      saveTestResult();
      alert("Test completed!");
      router.push("/");
    }
  };

  const handleEndTest = () => {
    saveTestResult();
    alert("Test ended!");
    router.push("/");
  };

  const saveTestResult = async () => {
    if (!user?.id) {
      console.error("Cannot save test result: userId is undefined. User must be logged in.");
      return;
    }

    const percentage = (correctAnswers / questions.length) * 100;
    console.log("Saving test result:", { userId: user.id, percentage, topic, paperId });
    try {
      const response = await fetch(`${BACKEND_URL}/api/save-test-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, percentage, topic, paperId }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Failed to save test result:", response.status, response.statusText, errorData);
        throw new Error("Failed to save test result");
      }
      const data = await response.json();
      console.log("Test result saved successfully:", data);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error saving test result:", error.message);
      } else {
        console.error("Error saving test result:", error);
      }
    }
  };

  const progressPercentage = ((questionIndex + 1) / questions.length) * 100;

  return (
    <SignedIn>
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center">
        <div className="bg-white border border-gray-500 rounded-xl shadow-lg z-50 p-4">
          <header className="w-full max-w-4xl bg-white flex justify-center items-center gap-5">
            <button onClick={() => router.push("/")} className="text-gray-600 cursor-pointer">
              <ArrowLeft size={30} color="#000" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Test Generated By Examina AI</h1>
          </header>

          <div className="w-full max-w-4xl p-6 flex">
            <div className="flex-1">
              {!testStarted ? (
                <div className="text-center bg-white gap-3 flex flex-col items-center">
                  <h2 className="text-xl font-semibold text-gray-700">
                    Test {paperId ? "from Uploaded Paper" : `on ${decodeURIComponent(topic)}`}
                  </h2>
                  {isLoading ? (
                    <p className="text-lg text-gray-600 input-text">Loading questions...</p>
                  ) : error ? (
                    <p className="text-lg text-red-500 input-text">{error}</p>
                  ) : (
                    <>
                      <p className="text-lg text-gray-600 input-text">
                        Select a timer duration to start the test:
                      </p>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleStartTest(5)}
                          className="p-2 text-lg font-bold text-black border border-gray-400 rounded-md shadow-md tracking-wider hover:bg-gray-100 explore transition cursor-pointer"
                        >
                          5 Minutes (15 Questions)
                        </button>
                        <button
                          onClick={() => handleStartTest(10)}
                          className="p-2 text-lg font-bold text-black border border-gray-400 rounded-md shadow-md tracking-wider hover:bg-gray-100 explore transition cursor-pointer"
                        >
                          10 Minutes (30 Questions)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center text-black mb-1 gap-5">
                    <div className="text-xl font-semibold text-black question tracking-wider">
                      Q:{questionIndex + 1}
                    </div>
                    <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-400 h-2.5 rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-black font-bold">{progressPercentage}%</div>
                  </div>
                  <div className="flex flex-col gap-4 justify-center items-center">
                    <div className="p-2 rounded-lg border-1 border-gray-400 shadow-md input-text">
                      <span className="text-lg font-semibold text-gray-800">
                        {questions[questionIndex]?.question || "Loading..."}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {questions[questionIndex]?.options.map((option: string, idx: number) => (
                        <label key={idx} className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="option"
                            checked={selectedOption === option}
                            onChange={() => handleOptionSelect(option)}
                            className="h-5 w-5 text-blue-500"
                          />
                          <span className="text-black input-text">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center items-center input-text mt-2">
                    <button
                      onClick={handleMarkForReview}
                      className="px-4 py-2 text-red-500 font-semibold flex items-center gap-2"
                    >
                      <span className="text-xl">★</span> Mark for review
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      className="px-4 py-2 text-green-500 font-semibold flex items-center justify-center gap-2"
                    >
                      Next Question <span className="text-xl">➔</span>
                    </button>
                    <button
                      onClick={() =>
                        alert(`Correct Answer: ${questions[questionIndex]?.answer}`)
                      }
                      className="px-4 py-2 text-blue-500 font-semibold flex items-center gap-2"
                    >
                      <span className="text-xl">✔</span>
                    </button>
                  </div>

                  <div>
                    <p className="text-black input-text">Correct Answer:</p>
                    <div className="border border-dashed border-black rounded p-2">
                      {selectedOption === questions[questionIndex]?.answer ? (
                        <span className="text-green-500 imput-text">{selectedOption}</span>
                      ) : (
                        <span className="text-gray-400">__________</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {testStarted && (
              <div className="w-48 bg-gray-200 p-4 flex flex-col items-center justify-center name tracking-wider border-black border-1 rounded-md shadow-md gap-5 ml-5">
                <button
                  onClick={handleEndTest}
                  className="px-4 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 text-md font-bold border border-gray-400 shadow-md tracking-wider cursor-pointer"
                >
                  End
                </button>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md">
                  <span className="text-2xl font-semibold text-gray-700">
                    {formatTime(timer)}
                  </span>
                </div>
                <p className="text-black">{timerOption / 60} min</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SignedIn>
  );
};

export default TestPage;