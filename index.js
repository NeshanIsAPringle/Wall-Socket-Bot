require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    Events 
} = require("discord.js");
const mongoose = require("mongoose");
const Groq = require("groq-sdk");

const {
    addToHistory,
    buildMessages
} = require("./memory/memoryManager");

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
    return "⚠️ im not telling";
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

// ---------------- DISCORD CLIENT ----------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,            // REQUIRED for slash commands
        GatewayIntentBits.GuildMessages,     // REQUIRED for messageCreate
        GatewayIntentBits.MessageContent,    // REQUIRED for reading messages
        GatewayIntentBits.GuildMembers       // FIXES guild=null issue
    ],
    partials: [
        Partials.Channel,                    // Fixes missing channel objects
        Partials.Message,
        Partials.User
    ]
});

// ---------------- MONGO CONNECTION ----------------

async function connectDB() {
    if (!process.env.MONGO_URI) {
        console.log("⚠️ No MONGO_URI found in .env");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB Error:", err);
    }
}

// ---------------- COMMAND LOADER ----------------

client.commands = new Map();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// ---------------- SLASH COMMAND HANDLER ----------------

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply("⚠️ Command crashed.");
        } else {
            await interaction.reply({ content: "⚠️ Command crashed.", ephemeral: true });
        }
    }
});

// ---------------- MENTION AI ----------------

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // ⭐ FIX: Prevent guild=null crash
    if (!message.guild) return;

    if (message.mentions.has(client.user)) {
        const prompt = message.content.replace(`<@${client.user.id}>`, "").trim();

        if (!prompt) {
            return message.reply("Ask me something, Plug.");
        }

        try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

            addToHistory(message.channel.id, "user", prompt);

            const { messages } = await buildMessages({
                guildId: message.guild.id,
                channelId: message.channel.id,
                userId: message.author.id,
                userContent: prompt,
                baseSystemPrompt: "You are wallsocket, a chaotic but helpful AI assistant."
            });

            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages
            });

            let reply = completion.choices[0].message.content;
            reply = filterMessage(reply);

            addToHistory(message.channel.id, "assistant", reply);

            message.reply(reply);

        } catch (err) {
            console.error(err);
            message.reply("AI broke for a sec, try again.");
        }
    }
});

// ---------------- READY ----------------

client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    connectDB();
});

// ---------------- LOGIN ----------------

if (!process.env.DISCORD_TOKEN) {
    console.error("❌ No DISCORD_TOKEN in .env");
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
