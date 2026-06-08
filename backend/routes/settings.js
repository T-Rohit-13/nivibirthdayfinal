const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const { requireAuth } = require("../middleware/auth");

// GET /api/settings
// Public — returns all site content for rendering the page
router.get("/", async (req, res) => {
  try {
    // Find or create the singleton settings document
    let settings = await Settings.findOne({ key: "main" });
    if (!settings) {
      settings = await Settings.create({ key: "main" });
    }
    res.json(settings);
  } catch (err) {
    console.error("GET /api/settings error:", err);
    res.status(500).json({ error: "Failed to load settings." });
  }
});

// PUT /api/settings
// Admin only — replaces all settings fields
router.put("/", requireAuth, async (req, res) => {
  try {
    const allowed = [
      "friendName", "landingSubtitle", "mainQuote",
      "personalMessage", "specialMemories", "futureWishes",
      "giftText", "finalMessage",
      "bgMusicData", "bgMusicName",
      "about", "wishes"
    ];

    const update = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { key: "main" },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json({ message: "Settings saved successfully.", settings });
  } catch (err) {
    console.error("PUT /api/settings error:", err);
    res.status(500).json({ error: "Failed to save settings." });
  }
});

module.exports = router;
