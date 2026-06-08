const express = require("express");
const router = express.Router();
const Timeline = require("../models/Timeline");
const { requireAuth } = require("../middleware/auth");

// GET /api/timeline
// Public — returns all timeline events sorted by order
router.get("/", async (req, res) => {
  try {
    const events = await Timeline.find().sort({ order: 1, createdAt: 1 });
    res.json(events);
  } catch (err) {
    console.error("GET /api/timeline error:", err);
    res.status(500).json({ error: "Failed to load timeline." });
  }
});

// POST /api/timeline
// Admin only — add a timeline event
router.post("/", requireAuth, async (req, res) => {
  try {
    const { date, description, photoData, order } = req.body;
    if (!date) return res.status(400).json({ error: "date is required." });

    const event = await Timeline.create({
      date,
      description: description || "",
      photoData:   photoData   || "",
      order:       order       || 0
    });

    res.status(201).json(event);
  } catch (err) {
    console.error("POST /api/timeline error:", err);
    res.status(500).json({ error: "Failed to save timeline event." });
  }
});

// PUT /api/timeline/:id
// Admin only — update a timeline event
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { date, description, photoData, order } = req.body;

    const event = await Timeline.findByIdAndUpdate(
      req.params.id,
      { $set: { date, description, photoData, order } },
      { new: true }
    );

    if (!event) return res.status(404).json({ error: "Event not found." });
    res.json(event);
  } catch (err) {
    console.error("PUT /api/timeline/:id error:", err);
    res.status(500).json({ error: "Failed to update timeline event." });
  }
});

// DELETE /api/timeline/:id
// Admin only — delete a timeline event
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const event = await Timeline.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });
    res.json({ message: "Event deleted." });
  } catch (err) {
    console.error("DELETE /api/timeline/:id error:", err);
    res.status(500).json({ error: "Failed to delete timeline event." });
  }
});

// POST /api/timeline/bulk
// Admin only — replace all timeline events at once
router.post("/bulk", requireAuth, async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "events must be an array." });
    }

    await Timeline.deleteMany({});
    const inserted = await Timeline.insertMany(
      events.map((e, i) => ({
        date:        e.date        || "",
        description: e.description || "",
        photoData:   e.photoData   || "",
        order:       i
      }))
    );

    res.json(inserted);
  } catch (err) {
    console.error("POST /api/timeline/bulk error:", err);
    res.status(500).json({ error: "Failed to bulk save timeline." });
  }
});

module.exports = router;
