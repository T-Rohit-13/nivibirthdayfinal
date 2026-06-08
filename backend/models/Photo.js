const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema({
  photoData: { type: String, required: true }, // base64 data URL
  caption:   { type: String, default: "" },
  songData:  { type: String, default: "" },    // base64 data URL of paired audio
  songName:  { type: String, default: "" },
  order:     { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Photo", PhotoSchema);
