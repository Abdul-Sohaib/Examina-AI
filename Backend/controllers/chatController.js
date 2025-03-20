const Chat = require("../models/Chat");
const { fetchGeminiResponse } = require("../services/geminiService");

const handleChatRequest = async (userId, message, mode) => {
  try {
    if (!userId || !message || !mode) {
      throw new Error("Missing required fields: userId, message, or mode.");
    }

    console.log("📩 Processing Chat:", { userId, message, mode });

    // Define the system instruction to restrict to education-related topics
    const systemInstruction = `You are an AI assistant specialized in education. 
    You will ONLY answer questions related to exams, studies, school subjects, and academic topics. 
    If the query is not related to education, politely decline to answer with: 
    "I'm sorry, I can only assist with education-related topics like exams, studies, or school subjects."`;

    let prompt;
    switch (mode) {
      case "Explain Topic":
        prompt = `Explain the following topic: "${message}". Provide examples.`;
        break;
      case "Explore Questions":
        prompt = `Generate a list of meaningful questions based on: "${message}".`;
        break;
      case "Start a Test":
        prompt = `Create a quiz with multiple-choice questions (MCQs) for: "${message}".`;
        break;
      default:
        throw new Error("Invalid mode selected.");
    }

    // Combine system instruction with the mode-specific prompt
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;

    console.log("🤖 AI Prompt:", fullPrompt);

    // Get AI response with the restricted prompt
    const aiResponse = await fetchGeminiResponse(fullPrompt);

    // Store in MongoDB
    const updatedChat = await Chat.findOneAndUpdate(
      { userId },
      {
        $push: {
          messages: [
            { role: "user", content: message, timestamp: new Date() },
            { role: "ai", content: aiResponse, timestamp: new Date() },
          ],
        },
      },
      { new: true, upsert: true }
    );

    return { answer: aiResponse, chatHistory: updatedChat.messages };
  } catch (error) {
    console.error("❌ Chat Error:", error);
    return { error: error.message || "An error occurred while processing the request." };
  }
};

module.exports = { handleChatRequest };