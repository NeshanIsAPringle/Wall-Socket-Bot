const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Groq = require("groq-sdk");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("summarize")
        .setDescription("Summarize any webpage into a short TL;DR")
        .addStringOption(option =>
            option.setName("url")
                .setDescription("The webpage URL to summarize")
                .setRequired(true)
        ),

    async execute(interaction) {
        const rawUrl = interaction.options.getString("url");
        await interaction.deferReply();

        let url = rawUrl.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        try {
            // Fetch raw HTML/text using a public API
            const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&audio=false&video=false&meta=false&screenshot=false`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!data || !data.data || !data.data.content) {
                return interaction.editReply("⚠️ I couldn't read that page. Try another URL.");
            }

            const pageText = data.data.content.text;

            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "You summarize webpages into short, clear TL;DRs."
                    },
                    {
                        role: "user",
                        content: `Summarize this webpage:\n\n${pageText}`
                    }
                ]
            });

            const summary = completion.choices[0].message.content;

            const embed = new EmbedBuilder()
                .setTitle("📝 Webpage Summary")
                .setDescription(summary)
                .setColor(0x00AEFF)
                .setFooter({ text: "Summarized using Groq + Microlink" });

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error("SUMMARIZE ERROR:", err);
            await interaction.editReply("⚠️ Something went wrong while summarizing.");
        }
    }
};
