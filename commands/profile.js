const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('el xp'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = await User.findOne({ userId });

        // Default values
        const background = user?.background || 'https://i.imgur.com/8bY3YzS.png';
        const level = user?.level || 12;
        const xp = user?.xp || 450;
        const xpNeeded = user?.xpNeeded || 900;
        const coins = user?.coins || 1200;

        // Canvas setup
        const canvas = Canvas.createCanvas(800, 250);
        const ctx = canvas.getContext('2d');

        // Background
        const bg = await Canvas.loadImage(background);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        // Overlay gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#00AEEF');
        gradient.addColorStop(1, '#0072FF');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.25;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ⭐ RESET OPACITY BEFORE DRAWING AVATAR
        ctx.globalAlpha = 1;

        // ⭐ Avatar glow (brightness)
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 125, 70, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
        ctx.restore();

        // ⭐ Avatar
        const avatar = await Canvas.loadImage(
            interaction.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true })
        );

        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 125, 60, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 40, 65, 120, 120);
        ctx.restore();

        // ⭐ Brighten avatar (only if loaded)
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 125, 60, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(40, 65, 120, 120);
        ctx.restore();

        // Username
        ctx.font = 'bold 36px Sans';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(interaction.user.username, 190, 120);

        // Level badge
        ctx.fillStyle = '#0072FF';
        ctx.roundRect(650, 80, 100, 50, 10);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Sans';
        ctx.fillText(`LVL ${level}`, 670, 115);

        // Coins
        ctx.font = '24px Sans';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`Coins: ${coins}`, 190, 160);

        // XP bar
        const barWidth = 500;
        const barHeight = 25;
        const barX = 190;
        const barY = 190;
        const progress = xp / xpNeeded;

        ctx.fillStyle = '#1E1E1E';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#00AEEF';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Sans';
        ctx.fillText(`${xp} / ${xpNeeded} XP`, barX + 180, barY + 20);

        // Send image
        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile.png' });
        await interaction.reply({ files: [attachment] });
    }
};
