const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows available commands'),

    async execute(interaction) {
        await interaction.reply(
            "Available commands:\n" +
            "• /ping\n" +
            "• /say <message>\n" +
            "• /help"
        );
    }
};