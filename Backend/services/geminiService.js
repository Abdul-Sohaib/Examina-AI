const axios = require("axios");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const fetchGeminiResponse = async (prompt) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY. Check your environment variables.");
    }

    // Add system instruction to restrict to education-related topics
    const systemInstruction = `You are an AI assistant specialized in education. 
    You will ONLY answer questions related to exams, studies, school subjects, and academic topics. 
    If the query is not related to education, politely decline to answer with: 
    "I'm sorry, I can only assist with education-related topics like exams, studies, or school subjects."`;

    // Combine system instruction with user prompt
    const fullPrompt = `${systemInstruction}\n\nUser: ${prompt}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ]
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    let aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";

    // Remove asterisks (*) and format the response
    aiResponse = aiResponse
      .replace(/\*/g, "")
      .replace(/\. /g, ".\n") // New line after each sentence
      .replace(/\n+/g, "\n") // Remove extra blank lines
      .trim();

    console.log("📝 Formatted AI Response:", aiResponse);
    return aiResponse;

  } catch (error) {
    console.error("Gemini API Error:", error?.response?.data || error.message);
    return "Failed to fetch response from Gemini API";
  }
};

module.exports = { fetchGeminiResponse };