const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const fetchGeminiResponse = async (prompt) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY. Check your environment variables.");
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    let model;
    try {
      // Attempt to use gemini-2.5-flash (free-tier compatible)
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    } catch (error) {
      console.warn("⚠ Warning: gemini-2.5-flash not available. Listing available models for debugging.");

      // List available models
      try {
        const models = await genAI.listModels();
        console.log("Available models:", models.map(m => m.name));
      } catch (listError) {
        console.error("Failed to list models:", listError.message);
      }

      throw new Error("No suitable model available. Please check API key permissions or available models.");
    }

    // Add system instruction to restrict to education-related topics
    const systemInstruction = `You are an AI assistant specialized in education. 
    You will ONLY answer questions related to exams, studies, school subjects, and academic topics. 
    If the query is not related to education, politely decline to answer with: 
    "I'm sorry, I can only assist with education-related topics like exams, studies, or school subjects."`;

    // Combine system instruction with user prompt
    const fullPrompt = `${systemInstruction}\n\nUser: ${prompt}`;

    // Generate content using the SDK
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let aiResponse = response.text();

    // Remove asterisks (*) and format the response
    aiResponse = aiResponse
      .replace(/\*/g, "")
      .replace(/\. /g, ".\n") // New line after each sentence
      .replace(/\n+/g, "\n") // Remove extra blank lines
      .trim();

    console.log("📝 Formatted AI Response:", aiResponse);
    return aiResponse;

  } catch (error) {
    console.error("Gemini API Error:", {
      message: error.message,
      stack: error.stack,
      details: error?.response?.data || "No additional error details",
    });
    return "Failed to fetch response from Gemini API";
  }
};

module.exports = { fetchGeminiResponse };