const { SlashCommandBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbackground')
        .setDescription('Set your profile background image')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Direct image URL (png/jpg)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const url = interaction.options.getString('url');
        const userId = interaction.user.id;

        // Basic validation
        if (!url.startsWith('http')) {
            return interaction.reply('❌ Please provide a valid image URL.');
        }

        let user = await User.findOne({ userId });

        if (!user) {
            user = new User({ userId, background: url });
        } else {
            user.background = url;
        }

        await user.save();

        await interaction.reply('✅ Background updated successfully!');
    }
};
