const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const GuildSettings = require("../models/GuildSettings");

const allowedModes = [
    "normal",
    "funny",
    "toxic",
    "chaotic",
    "helpful",
    "roleplay",
    "sarcastic",
    "kid-friendly",
    "professional",
    "anime",
    "gamer",
    "roaster",
    "therapist",
    "storyteller"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setaimode")
        .setDescription("Set the AI personality for this server")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName("mode")
                .setDescription("Choose AI mode")
                .setRequired(true)
                .addChoices(
                    ...allowedModes.map(m => ({ name: m, value: m }))
                )
        ),

    async execute(interaction) {
        const mode = interaction.options.getString("mode");

        let settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
        if (!settings) {
            settings = await GuildSettings.create({ guildId: interaction.guild.id });
        }

        settings.aiMode = mode;
        await settings.save();

        await interaction.reply(`✅ AI mode for this server set to **${mode}**`);
    }
};
