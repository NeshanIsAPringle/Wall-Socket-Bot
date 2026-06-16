const User = require('../models/User');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bots + slash commands
        if (message.author.bot) return;
        if (message.content.startsWith('/')) return;

        const userId = message.author.id;

        // Fetch or create user
        let user = await User.findOne({ userId });
        if (!user) {
            user = new User({
                userId,
                xp: 0,
                xpNeeded: 100,
                level: 1,
                prestige: 0,
                coins: 0
            });
const cooldown = 60000; // 60 seconds

// If user has a cooldown and it's not expired
if (user.lastXP && Date.now() - user.lastXP < cooldown) {
    return; // no XP this message
}

// Update last XP timestamp
user.lastXP = Date.now();

        }

        // XP gain per message
        const xpGain = 15; // you can change this
        user.xp += xpGain;

        // Level up check
        if (user.xp >= user.xpNeeded) {
            user.level += 1;
            user.xp -= user.xpNeeded;
            user.xpNeeded = Math.floor(user.xpNeeded * 1.25);

            message.channel.send(
                `🎉 **${message.author.username} leveled up to Level ${user.level}!**`
            );
        }

        await user.save();
    }
};
