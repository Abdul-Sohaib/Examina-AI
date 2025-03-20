export const fetchChatResponse = async (message: string, mode: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/chat", {
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
  