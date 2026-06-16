const mongoose = require("mongoose");

const userMemorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    preferences: {
        type: Object,
        default: {}
    },
    personality: {
        type: String,
        default: "normal"
    },
    longTermNotes: {
        type: String,
        default: ""
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

userMemorySchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model("UserMemory", userMemorySchema);
