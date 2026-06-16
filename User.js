const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },

    // Profile customization
    background: { type: String, default: null },

    // Leveling system
    xp: { type: Number, default: 0 },
    xpNeeded: { type: Number, default: 100 },
    level: { type: Number, default: 1 },

    // Prestige system
    prestige: { type: Number, default: 0 },

    // Currency
    coins: { type: Number, default: 0 },

    // XP cooldown
    lastXP: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);