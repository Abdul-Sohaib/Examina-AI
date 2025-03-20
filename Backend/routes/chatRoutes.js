const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat"); // Ensure this model exists

// Chat message storage route
router.post("/chats", async (req, res) => {
  try {
    const { userId, message, mode } = req.body;

    // Validate request body
    if (!userId || !message || !mode) {
      return res.status(400).json({ error: "Missing required fields: userId, message, or mode" });
    }

    // Save message to database (if using MongoDB)
    const newChat = new Chat({ userId, text: message, mode });
    await newChat.save();

    res.status(201).json({ success: true, answer: `Received: ${message}` });
  } catch (error) {
    console.error("Chat save error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
