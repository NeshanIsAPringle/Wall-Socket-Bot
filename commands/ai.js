const { SlashCommandBuilder } = require("discord.js");
const Groq = require("groq-sdk");
const {
    addToHistory,
    buildMessages
} = require("../memory/memoryManager");

// ---------------- FILTER SYSTEM ----------------

const bannedWords = [
    "slur1", "slur2", "slur3",
    "nsfw1", "nsfw2", "nsfw3"
];

const nsfwKeywords = [
    "sex", "nude", "porn", "hentai", "explicit"
];

const toxicKeywords = [
    "kill yourself", "kys", "die", "hate you", "worthless"
];

function autoRewrite(text) {
    return "⚠️ Message was rewritten for safety:\nThe AI tried to say something unsafe, so I cleaned it up.";
}

function filterMessage(text) {
    let lower = text.toLowerCase();

    for (const word of bannedWords) {
        if (lower.includes(word)) return autoRewrite(text);
    }

    for (const word of nsfwKeywords) {
        if (lower.includes(word)) return autoRewrite(text);
    }

    for (const phrase of toxicKeywords) {
        if (lower.includes(phrase)) return autoRewrite(text);
    }

    const mildWords = ["damn", "hell", "stupid"];
    let filtered = text;

    for (const word of mildWords) {
        const regex = new RegExp(word, "gi");
        filtered = filtered.replace(regex, "****");
    }

    return filtered;
}

// ---------------- SLASH COMMAND ----------------

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ai")
        .setDescription("Chat with the AI")
        .addStringOption(option =>
            option.setName("message")
                .setDescription("What do you want to say?")
                .setRequired(true)
        ),

    async execute(interaction) {
        console.log("AI slash command triggered");

        try {
            await interaction.deferReply();

            // ⭐ FIX #1 — Prevent guild null crash
            if (!interaction.guild) {
                return interaction.editReply("⚠️ This command only works inside servers, not DMs.");
            }

            // ⭐ FIX #2 — Prevent channel null crash
            if (!interaction.channel) {
                return interaction.editReply("⚠️ I can't access this channel.");
            }

            const groq = new Groq({
                apiKey: process.env.GROQ_API_KEY
            });

            const userMessage = interaction.options.getString("message");

            // Add user message to short-term memory
            addToHistory(interaction.channel.id, "user", userMessage);

            // Build full message context (server settings + user memory + convo history)
            const { messages } = await buildMessages({
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                userId: interaction.user.id,
                userContent: userMessage
            });

            // Send to Groq
            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages
            });

            let reply = completion.choices[0].message.content;

            // Apply safety filters
            reply = filterMessage(reply);

            // Add assistant reply to short-term memory
            addToHistory(interaction.channel.id, "assistant", reply);

            await interaction.editReply(reply);

        } catch (err) {
            console.error("AI COMMAND ERROR:", err);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply("⚠️ AI had a meltdown. Check console.");
            } else {
                await interaction.reply("⚠️ AI had a meltdown. Check console.");
            }
        }
    }
};
