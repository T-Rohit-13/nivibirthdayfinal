const mongoose = require("mongoose");

const TimelineSchema = new mongoose.Schema({
  date:        { type: String, required: true },
  description: { type: String, default: "" },
  photoData:   { type: String, default: "" }, // base64 data URL
  order:       { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Timeline", TimelineSchema);
