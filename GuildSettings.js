const mongoose = require("mongoose");

const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    aiMode: {
        type: String,
        default: "normal"
    },
    filterLevel: {
        type: String,
        default: "medium" // low, medium, high
    },
    memoryEnabled: {
        type: Boolean,
        default: true
    },
    allowedChannels: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model("GuildSettings", guildSettingsSchema);
