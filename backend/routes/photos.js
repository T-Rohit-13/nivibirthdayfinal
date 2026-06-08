const express = require("express");
const router = express.Router();
const Photo = require("../models/Photo");
const { requireAuth } = require("../middleware/auth");

// GET /api/photos
// Public — returns all photos sorted by order
router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find().sort({ order: 1, createdAt: 1 });
    res.json(photos);
  } catch (err) {
    console.error("GET /api/photos error:", err);
    res.status(500).json({ error: "Failed to load photos." });
  }
});

// POST /api/photos
// Admin only — add a new photo
// Body: { photoData, caption, songData, songName, order }
router.post("/", requireAuth, async (req, res) => {
  try {
    const { photoData, caption, songData, songName, order } = req.body;

    if (!photoData) {
      return res.status(400).json({ error: "photoData is required." });
    }

    const photo = await Photo.create({
      photoData,
      caption: caption || "",
      songData: songData || "",
      songName: songName || "",
      order: order || 0
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error("POST /api/photos error:", err);
    res.status(500).json({ error: "Failed to save photo." });
  }
});

// PUT /api/photos/:id
// Admin only — update caption or song for a specific photo
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { caption, songData, songName, order } = req.body;

    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { $set: { caption, songData, songName, order } },
      { new: true }
    );

    if (!photo) return res.status(404).json({ error: "Photo not found." });
    res.json(photo);
  } catch (err) {
    console.error("PUT /api/photos/:id error:", err);
    res.status(500).json({ error: "Failed to update photo." });
  }
});

// DELETE /api/photos/:id
// Admin only — remove a photo
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found." });
    res.json({ message: "Photo deleted." });
  } catch (err) {
    console.error("DELETE /api/photos/:id error:", err);
    res.status(500).json({ error: "Failed to delete photo." });
  }
});

// POST /api/photos/bulk
// Admin only — replace all photos at once (used by Save All in admin panel)
router.post("/bulk", requireAuth, async (req, res) => {
  try {
    const { photos } = req.body;
    if (!Array.isArray(photos)) {
      return res.status(400).json({ error: "photos must be an array." });
    }

    // Delete all existing and re-insert
    await Photo.deleteMany({});
    const inserted = await Photo.insertMany(
      photos.map((p, i) => ({
        photoData: p.photoData || "",
        caption:   p.caption   || "",
        songData:  p.songData  || "",
        songName:  p.songName  || "",
        order:     i
      }))
    );

    res.json(inserted);
  } catch (err) {
    console.error("POST /api/photos/bulk error:", err);
    res.status(500).json({ error: "Failed to bulk save photos." });
  }
});

module.exports = router;
