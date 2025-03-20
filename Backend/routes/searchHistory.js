const express = require("express");
const mongoose = require("mongoose");
const SearchHistory = require("../models/searchHistory.model.js");

const router = express.Router();

/** 
 * 📌 Save a new search history entry for a specific user
 */
router.post("/save", async (req, res) => {
  try {
    const { userId, query, option } = req.body;
    if (!userId || !query || !option) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const newHistory = new SearchHistory({ userId, query, option });
    console.log("✅ Saving search history:", newHistory);
    await newHistory.save();

    res.status(201).json({ message: "Search saved successfully!", history: newHistory });
  } catch (error) {
    console.error("❌ Error saving history:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/** 
 * 📌 Fetch the latest search history entry for a user
 */
router.get("/latest/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Fetching search history for user: ${userId}`);

    const historyEntries = await SearchHistory.find({ userId }).sort({ createdAt: -1 });

    if (!historyEntries.length) {
      console.warn("⚠️ No search history found for this user.");
      return res.status(404).json({ error: "No history found" });
    }

    console.log("✅ Search history:", historyEntries);
    res.json(historyEntries);
  } catch (error) {
    console.error("❌ Error fetching search history:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📌 Fetch all search history for a specific user
 */
router.get("/all/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Fetching all search history for user: ${userId}`);

    const history = await SearchHistory.find({ userId }).sort({ createdAt: -1 });

    if (!history.length) {
      console.warn("⚠️ No history found for this user.");
      return res.status(404).json({ error: "No history found" });
    }

    console.log("✅ Found search history:", history);
    res.json(history);
  } catch (error) {
    console.error("❌ Error fetching history:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
