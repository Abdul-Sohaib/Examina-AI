const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },  // Ensure it's stored as a string
  option: String,
  query: String,
  createdAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model("SearchHistory", searchHistorySchema);
