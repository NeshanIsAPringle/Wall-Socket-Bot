const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('makes bot say inputted phrase')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('What should I say')
                .setRequired(true)
        ),

    async execute(interaction) {
        const msg = interaction.options.getString('message');
        await interaction.reply(msg);
    }
};