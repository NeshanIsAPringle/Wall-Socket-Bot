const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kkammm')
        .setDescription('Send milk emojis! max:150')
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('How many milks to send')
                .setRequired(true)
        ),

    async execute(interaction) {
        const quantity = interaction.options.getInteger('quantity');

        if (quantity < 1) {
            return interaction.reply({
                content: 'Quantity must be at least 1',
                ephemeral: true
            });
        }

        if (quantity > 150) {
            return interaction.reply({
                content: 'dude...',
                ephemeral: true
            });
        }

        const milk = '🥛';
        const message = milk.repeat(quantity);

        await interaction.reply(message);
    }
};
