const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("screenshot")
        .setDescription("Take a live screenshot of a website")
        .addStringOption(option =>
            option.setName("url")
                .setDescription("The website URL (e.g. https://google.com)")
                .setRequired(true)
        ),

    async execute(interaction) {
        const rawUrl = interaction.options.getString("url");

        await interaction.deferReply();

        // Basic URL cleanup
        let url = rawUrl.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        try {
            // Use a public screenshot service (no extra npm needed)
            const encoded = encodeURIComponent(url);
            const screenshotUrl = `https://image.thum.io/get/width/1280/crop/800/${encoded}`;

            const embed = new EmbedBuilder()
                .setTitle("📸 Website Screenshot")
                .setDescription(`URL: ${url}`)
                .setImage(screenshotUrl)
                .setColor(0x00AEFF)
                .setFooter({ text: "If it’s blank, the site may block screenshots or be down." });

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error("SCREENSHOT ERROR:", err);
            await interaction.editReply("⚠️ I couldn't capture that site. Try a different URL.");
        }
    }
};
