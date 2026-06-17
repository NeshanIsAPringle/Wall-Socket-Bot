const UserMemory = require("../models/UserMemory");
const GuildSettings = require("../models/GuildSettings");

// in‑memory short‑term conversation buffer: channelId -> [{role, content}]
const convoBuffers = new Map();
const MAX_HISTORY = 5;

async function getOrCreateGuildSettings(guildId) {
    if (!guildId) return null;
    let settings = await GuildSettings.findOne({ guildId });
    if (!settings) {
        settings = await GuildSettings.create({ guildId });
    }
    return settings;
}

async function getOrCreateUserMemory(userId, guildId) {
    if (!userId || !guildId) return null;
    let mem = await UserMemory.findOne({ userId, guildId });
    if (!mem) {
        mem = await UserMemory.create({ userId, guildId });
    }
    return mem;
}

function addToHistory(channelId, role, content) {
    if (!channelId) return;
    if (!convoBuffers.has(channelId)) convoBuffers.set(channelId, []);
    const arr = convoBuffers.get(channelId);
    arr.push({ role, content });
    if (arr.length > MAX_HISTORY) arr.shift();
}

function getHistory(channelId) {
    if (!channelId) return [];
    return convoBuffers.get(channelId) || [];
}

async function buildMessages({ guildId, channelId, userId, userContent, baseSystemPrompt }) {
    const guildSettings = await getOrCreateGuildSettings(guildId);
    const userMemory = await getOrCreateUserMemory(userId, guildId);

    const mode = guildSettings?.aiMode || "normal";

    const personalities = {
        normal: "You are a helpful, smart assistant.",
        funny: "You are a chaotic, funny assistant who jokes but stays safe.",
        toxic: "You are sarcastic and blunt but do not cross real harm or hate.",
        chaotic: "You are unpredictable, energetic, but never harmful.",
        helpful: "You are calm, detailed, and focused on solving problems.",
        roleplay: "You speak in character and stay immersive, but keep it safe.",
        sarcastic: "You are witty, dry, and sarcastic without being cruel.",
        "kid-friendly": "You speak simply, kindly, and avoid anything inappropriate.",
        professional: "You are formal, clear, and business‑like.",
        anime: "You speak like an anime character, dramatic and expressive, but safe.",
        gamer: "You speak like a gamer, using light gamer slang, but no slurs.",
        roaster: "You roast people playfully without crossing into bullying or hate.",
        therapist: "You are gentle, reflective, and supportive, but not a real professional.",
        storyteller: "You answer as a storyteller, vivid and descriptive."
    };

    const systemPrompt =
        baseSystemPrompt ||
        personalities[mode] ||
        personalities.normal;

    const history = getHistory(channelId);

    const messages = [
        { role: "system", content: systemPrompt }
    ];

    if (userMemory && userMemory.longTermNotes) {
        messages.push({
            role: "system",
            content: `Here are some long‑term notes about this user: ${userMemory.longTermNotes}`
        });
    }

    for (const h of history) {
        messages.push(h);
    }

    messages.push({ role: "user", content: userContent });

    return { messages, guildSettings, userMemory };
}

async function updateUserMemory(userMemory, newInfo) {
    if (!userMemory) return;
    if (newInfo?.notes) {
        userMemory.longTermNotes =
            (userMemory.longTermNotes || "") + "\n" + newInfo.notes;
    }
    userMemory.lastUpdated = new Date();
    await userMemory.save();
}

module.exports = {
    getOrCreateGuildSettings,
    getOrCreateUserMemory,
    addToHistory,
    getHistory,
    buildMessages,
    updateUserMemory
};
