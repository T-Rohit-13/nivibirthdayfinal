const mongoose = require("mongoose");

const AboutCardSchema = new mongoose.Schema({
  icon: { type: String, default: "💫" },
  title: { type: String, default: "" },
  text: { type: String, default: "" }
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
  // Singleton document — always use key: "main"
  key: { type: String, default: "main", unique: true },

  friendName:       { type: String, default: "Nivi" },
  landingSubtitle:  { type: String, default: "A little surprise made just for you ✨" },
  mainQuote:        { type: String, default: "The world became a little more beautiful the day you were born. Happy Birthday! ❤️" },
  personalMessage:  { type: String, default: "" },
  specialMemories:  { type: String, default: "" },
  futureWishes:     { type: String, default: "" },
  giftText:         { type: String, default: "" },
  finalMessage:     { type: String, default: "" },

  // Background music stored as base64 data URL (or empty string)
  bgMusicData:      { type: String, default: "" },
  bgMusicName:      { type: String, default: "" },

  about: {
    type: [AboutCardSchema],
    default: [
      { icon: "💫", title: "Her Personality",            text: "Write about her personality..." },
      { icon: "🏆", title: "Her Achievements",           text: "Write about her achievements..." },
      { icon: "😂", title: "Funny Moments",              text: "Write about funny moments..." },
      { icon: "💖", title: "Why She Is Special",         text: "Write why she is special..." },
      { icon: "🌸", title: "Favorite Memories Together", text: "Write favorite memories..." },
      { icon: "🙏", title: "Things I Thank Her For",     text: "Write things to thank her for..." }
    ]
  },

  wishes: {
    type: [String],
    default: [
      "May your birthday be filled with happiness and love.",
      "Wishing you a year of success and good health.",
      "May all your dreams and aspirations come true."
    ]
  }

}, { timestamps: true });

module.exports = mongoose.model("Settings", SettingsSchema);
