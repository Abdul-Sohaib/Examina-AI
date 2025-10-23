const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const fetchChatResponse = async (message: string, mode: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode }),
    });

    const data = await response.json();
    return data.answer || "Error fetching response";
  } catch (error) {
    console.error("Error:", error);
    return "Failed to connect to AI";
  }
};