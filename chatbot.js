const chat = document.getElementById('chat');
const input = document.getElementById('input');
const send = document.getElementById('send');

let userHistory = [];
let botHistory = [];
let lastBotWasJoke = false;
let jokeFollowupPending = false;

// ========== MINI BRAIN (Learning & Memory) ==========
let brain = JSON.parse(localStorage.getItem('mossai_brain') || '{}');

// Save brain to localStorage
function saveBrain() {
  localStorage.setItem('mossai_brain', JSON.stringify(brain));
}

// Teach MossAI facts
function learnFact(message) {
  const patterns = [
    /remember (.+?) is (.+)/i,
    /learn:?\s*(.+?) is (.+)/i,
    /teach you:? (.+?) is (.+)/i,
    /my ([\w\s]+) is (.+)/i
  ];
  for (const pat of patterns) {
    const match = message.match(pat);
    if (match) {
      let key = match[1].trim().toLowerCase();
      let value = match[2].trim();
      brain[key] = value;
      saveBrain();
      return `Got it! I'll remember: <b>${match[1].trim()} is ${value}</b>.`;
    }
  }
  return null;
}

// Retrieve facts
function recallFact(message) {
  const patterns = [
    /what is (.+)\?/i,
    /who is (.+)\?/i,
    /where is (.+)\?/i,
    /what's (.+)\?/i,
    /tell me (.+)/i,
    /do you know (.+)\?/i,
    /my ([\w\s]+)\?/i
  ];
  for (const pat of patterns) {
    const match = message.match(pat);
    if (match) {
      let key = match[1].trim().toLowerCase();
      if (brain[key]) {
        return `${capitalize(key)} is <b>${brain[key]}</b>.`;
      }
    }
  }
  const myPat = /what(?:'s| is) my ([\w\s]+)\??/i;
  const myMatch = message.match(myPat);
  if (myMatch) {
    let key = `my ${myMatch[1].trim().toLowerCase()}`;
    if (brain[key]) {
      return `Your ${myMatch[1].trim()} is <b>${brain[key]}</b>.`;
    }
  }
  return null;
}

// Correction
function correctFact(message) {
  const pat = /no,? my ([\w\s]+) is (.+)/i;
  const match = message.match(pat);
  if (match) {
    let key = `my ${match[1].trim().toLowerCase()}`;
    let value = match[2].trim();
    brain[key] = value;
    saveBrain();
    return `Thanks for correcting me! Your ${match[1].trim()} is now <b>${value}</b>.`;
  }
  return null;
}

// Video shortlinks for fun keywords
const videoShortcuts = {
  "send the max fosh i found the baby born next to me": "https://www.youtube.com/watch?v=UZhdVw1jXoE",
  "rickroll": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
};

const commands = {
  "/help": () => 
    `<b>MossAI Commands:</b><br>
    /help - Show this help<br>
    /joke - Tell a random joke<br>
    /quote - Inspire with a quote<br>
    /fact - Tell a cool fact<br>
    /news - Show world & music news<br>
    /imagine [prompt] - Generate a creative idea<br>
    /summarize [text] - Summarize your text<br>
    /explain [topic] - Explain a topic simply (e.g. /explain jazz, /explain blockchain)<br>
    /history - Show your chat history<br>
    /clear - Clear the chat<br>
    <b>Videos:</b> Paste a YouTube link or try: <i>send the max fosh i found the baby born next to me</i>`,
  "/joke": () => {
    lastBotWasJoke = true;
    jokeFollowupPending = true;
    return randomFrom(jokeList);
  },
  "/quote": () => randomFrom([
    "“The best way to get started is to quit talking and begin doing.” – Walt Disney",
    "“Innovation distinguishes between a leader and a follower.” – Steve Jobs",
    "“Code is like humor. When you have to explain it, it’s bad.” – Cory House",
    "“Simplicity is the soul of efficiency.” – Austin Freeman"
  ]),
  "/fact": () => randomFrom([
    "Did you know? The first computer bug was an actual moth.",
    "JavaScript was created in just 10 days.",
    "The first webcam watched a coffee pot at Cambridge University.",
    "More data has been created in the last two years than in the previous history of humanity.",
    "The most-streamed artist on Spotify in 2024 was Taylor Swift."
  ]),
  "/news": () => {
    const newsHeadlines = [
      "🎵 <b>Dua Lipa</b> announces new album 'Radical Optimism' released to critical acclaim.",
      "🌎 <b>World News:</b> NASA's Artemis II mission gets new launch window for Moon return.",
      "🎶 <b>Taylor Swift</b> makes history with Eras Tour, grossing over $1B worldwide.",
      "🎧 <b>AI Music</b> tools spark debate among artists over copyright and creativity.",
      "📺 <b>Eurovision 2025:</b> Sweden wins with synth-pop anthem."
    ];
    return "<b>World & Music News:</b><br>" + newsHeadlines.map(h=>`• ${h}`).join("<br>");
  },
  "/imagine": (msg) => {
    const prompt = msg.replace(/^\/imagine\s*/i, "") || "something fun";
    return `Here's a creative idea: <i>${capitalize(prompt)}... as a video game character in a pixel art world!</i>`;
  },
  "/summarize": (msg) => {
    const text = msg.replace(/^\/summarize\s*/i, "");
    if (!text) return "Please provide text to summarize, like: <b>/summarize</b> The sun is a star...";
    return `Summary: <i>${summarize(text)}</i>`;
  },
  "/explain": (msg) => {
    const topic = msg.replace(/^\/explain\s*/i, "");
    if (!topic) return "Please provide a topic to explain, e.g. <b>/explain jazz</b>";
    return explainSimple(topic);
  },
  "/history": () => {
    if(userHistory.length === 0) return "No chat history yet!";
    return "<b>Recent User Messages:</b><br>" + userHistory.slice(-10).map((msg,i) => `${i+1}. ${escapeHTML(msg)}`).join("<br>");
  },
  "/clear": () => {
    chat.innerHTML = '';
    userHistory = [];
    botHistory = [];
    lastBotWasJoke = false;
    jokeFollowupPending = false;
    addMessage("bot", "Chat history cleared. Hi, I'm MossAI v3.02! Type /help for commands.");
    return "";
  }
};

const jokeList = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "Why did the JavaScript developer wear glasses? Because they couldn't C#.",
  "Why was the computer cold? It left its Windows open.",
  "Why did the developer go broke? Because he used up all his cache!",
  "Why do Java developers wear glasses? Because they don't C#!",
  "Why did the computer go to the doctor? Because it had a virus!"
];

const rules = [
  { 
    pattern: /(you (doing|up to|busy|got plans).*today|what are you doing|anything going on|how's your day)/i, 
    reply: [
      "Not much on my end—just chilling in the cloud and ready to help with whatever you throw at me! 😎 Got something fun or creative planned today, Harrison? Music session? Hacking experiments? Chocolate run?",
      "I'm just hanging out, always here for you! ✨ Anything exciting on your agenda, Harrison?",
      "Just waiting to see what cool ideas you'll bring me today! 🚀"
    ] 
  },
  { pattern: /hello|hi|hey/i, reply: ["Hi there! 👋", "Hey! How can I help you?", "Hello, friend!"] },
  { pattern: /how are you/i, reply: ["I'm just code, but feeling clever! How about you?"] },
  { pattern: /your name|who are you/i, reply: ["I'm MossAI v3.02, your friendly browser chatbot."] },
  { pattern: /help/i, reply: ["Type /help for a list of commands or just chat with me!"] },
  { pattern: /weather/i, reply: ["I can't check the weather, but I hope it's nice where you are!"] },
  { pattern: /joke/i, reply: [commands["/joke"]()] },
  { pattern: /quote/i, reply: [commands["/quote"]()] },
  { pattern: /news|music news/i, reply: [commands["/news"]()] },
  { pattern: /bye|goodbye|see you/i, reply: ["Goodbye! 👋", "See you next time!", "Bye!"] },
  { pattern: /fact/i, reply: [commands["/fact"]()] }
];

const markovSource = `
Welcome to the MossAI chat experience.
Innovation and creativity are at your fingertips.
Type a command or just chat with me about anything.
Every conversation is a new adventure.
Curiosity is the key to learning and discovery.
`;
function buildMarkovChain(text) {
  const words = text.split(/\s+/).filter(w => w);
  const chain = {};
  for(let i=0; i < words.length-1; i++) {
    const word = words[i].toLowerCase();
    if(!chain[word]) chain[word] = [];
    chain[word].push(words[i+1]);
  }
  return {chain, startWords: words.filter(w => w[0] === w[0].toUpperCase())};
}
const markov = buildMarkovChain(markovSource);
function markovReply(len=10) {
  let word = markov.startWords[Math.floor(Math.random()*markov.startWords.length)].toLowerCase();
  let result = [word[0].toUpperCase() + word.slice(1)];
  for(let i=0;i<len-1;i++) {
    let next = (markov.chain[word] || [])[Math.floor(Math.random()*(markov.chain[word]||['.']).length)];
    if(!next) break;
    result.push(next);
    word = next.toLowerCase();
  }
  return result.join(' ') + '.';
}

// Utility functions
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[m]);
}
function summarize(text) {
  const sentences = text.split(/\.|\?|!/).map(s => s.trim()).filter(Boolean);
  if(sentences.length === 0) return text;
  if(sentences.length === 1) return sentences[0];
  return sentences[0] + (sentences[1] ? '. ' + sentences[1] + '...' : '...');
}
function explainSimple(topic) {
  const t = topic.toLowerCase().trim();
  switch(t) {
    case "recursion":
      return "Recursion is when a function calls itself to solve a smaller part of a problem, often until a base case is reached.";
    case "ai":
    case "artificial intelligence":
      return "AI stands for Artificial Intelligence: making computers do things that usually require human intelligence, like recognizing images or understanding language.";
    case "javascript":
      return "JavaScript is a programming language for making web pages interactive. It runs in your browser!";
    case "markov chain":
      return "A Markov chain is a way to generate sequences (like text) where each next step depends only on the current state, not the full history.";
    case "blockchain":
      return "Blockchain is a digital ledger technology where transactions are recorded in linked blocks, making them secure and tamper-resistant.";
    case "jazz":
      return "Jazz is a music genre that originated in African-American communities, known for improvisation, swing, and expressive rhythms.";
    case "taylor swift":
      return "Taylor Swift is a Grammy-winning singer-songwriter known for her storytelling, genre-spanning albums, and cultural impact in pop and country music.";
    case "max fosh":
      return "Max Fosh is a British YouTuber famous for his humorous street interviews and unique social experiments.";
    case "eurovision":
      return "Eurovision is an annual international song competition, popular in Europe, known for its extravagant performances and catchy tunes.";
    case "llm":
    case "large language model":
      return "A Large Language Model (LLM) is a type of AI trained on huge text datasets to generate and understand human-like language, like ChatGPT.";
    default:
      return `Sorry, I don't have a simple explanation for <b>${escapeHTML(topic)}</b>, but you can try to /imagine it!`;
  }
}

// ---- NEW: More robust YouTube ID extraction
function extractYouTubeID(url) {
  const ytRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(ytRegex);
  return match ? match[1] : null;
}
function embedYouTube(url) {
  const id = extractYouTubeID(url);
  if(!id) return "Couldn't embed the video. Please check the link!";
  return `<span>Here's your video:</span><br>
  <iframe width="340" height="200" src="https://www.youtube.com/embed/${id}" allowfullscreen style="border-radius:12px;border:none;box-shadow:0 2px 16px #0002;"></iframe>`;
}
function isLaughter(msg) {
  return /(haha|lol|lmao|rofl|😂|🤣|hehe|funny|good one|brilliant|amazing joke)/i.test(msg);
}
function isYes(msg) {
  return /^(yes|yep|yess|sure|ok|another|go on|why not|yeah|please|do it|more)$/i.test(msg.trim());
}
function isNo(msg) {
  return /^(no|nah|nope|not now|don't)$/i.test(msg.trim());
}

// ---- NEW: 40+ fallback replies
const fallbackReplies = [
  "what ...",
  "Are you speaking in code? 😅",
  "That one went over my circuits!",
  "Please clarify? My AI mind is puzzled.",
  "Hmm, not sure what you mean—try rephrasing?",
  "You know, sometimes I just say what ...",
  "Error 404: wit not found.",
  "That makes about as much sense as a screen door on a submarine.",
  "My sensors are fuzzy on that one.",
  "Did you try turning it off and on again?",
  "I'm still learning—mind giving me a hint?",
  "Are you sure that's English? 🤖",
  "I asked my crystal ball and it just said 'no clue'.",
  "Well, that's mysterious!",
  "I think that’s a riddle for another day.",
  "I’m not sure, but I’d love to learn!",
  "If I had lips, I'd whistle right now.",
  "Was that a test? Did I pass?",
  "Let me phone a friend... wait, I have no friends.",
  "If I had a brain, it might be melting right now.",
  "Bzzt! I'm not wired for that one.",
  "That’s above my pay grade.",
  "Oops! My magic 8-ball says 'ask again later.'",
  "That’s a noodle-scratcher.",
  "I’m only an AI, not a mind reader!",
  "You found my weak spot!",
  "That’s one for the philosophers.",
  "Let’s just say... I have no idea.",
  "I’ll get back to you when I finish my AI degree.",
  "That’s a mystery even to me.",
  "I’ll just nod and pretend I understand.",
  "Sorry, can you say that again?",
  "My best guess: 🦄",
  "I’ve got nothing. Nada. Zilch.",
  "If I could shrug, I would!",
  "That’s a question for the ages.",
  "I’ll need more coffee for that one.",
  "Beep boop? Beep beep boop.",
  "I feel like you just rickrolled my brain.",
  "You win this round.",
  "That’s a plot twist I didn’t see coming.",
  "Is that in the syllabus?",
  "Remind me to ask ChatGPT about this.",
  "I’m going to have to Google that.",
  "I’m as confused as a chameleon in a bag of Skittles.",
];

// ---- MODIFIED: Fallback now picks from fallbackReplies
function getBotReply(message) {
  // 1. Correction?
  let correction = correctFact(message);
  if (correction) return correction;

  // 2. Did user teach a fact?
  let learned = learnFact(message);
  if (learned) return learned;

  // 3. Is user asking about a fact?
  let recall = recallFact(message);
  if (recall) return recall;

  // Video keyword shortcut
  const shortcut = Object.keys(videoShortcuts).find(k => message.toLowerCase().includes(k));
  if(shortcut) {
    const url = videoShortcuts[shortcut];
    lastBotWasJoke = false;
    jokeFollowupPending = false;
    return embedYouTube(url);
  }

  // YouTube link detection
  if(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(message)) {
    const id = extractYouTubeID(message);
    lastBotWasJoke = false;
    jokeFollowupPending = false;
    if(id) return embedYouTube(`https://www.youtube.com/watch?v=${id}`);
    else return "Sorry, I couldn't recognize that YouTube link.";
  }

  // Joke followup: if user laughs after a joke
  if(jokeFollowupPending && isLaughter(message)) {
    jokeFollowupPending = false;
    return "😄 You liked that one! Want another?";
  }
  // After "Want another?", check for yes/no
  if(lastBotWasJoke && !jokeFollowupPending && (isYes(message) || isNo(message))) {
    if(isYes(message)) {
      jokeFollowupPending = true;
      return randomFrom(jokeList);
    }
    if(isNo(message)) {
      lastBotWasJoke = false;
      return "Alright! Let me know if you want to hear another joke any time. 😁";
    }
  }

  // Command handling
  if(message.startsWith("/")) {
    const cmd = message.split(" ")[0].toLowerCase();
    if(commands[cmd]) {
      const result = commands[cmd](message);
      if (cmd === "/joke" && result) {
        lastBotWasJoke = true;
        jokeFollowupPending = true;
      } else if (cmd !== "/joke") {
        lastBotWasJoke = false;
        jokeFollowupPending = false;
      }
      if(result) botHistory.push(result);
      return result;
    } else {
      lastBotWasJoke = false;
      jokeFollowupPending = false;
      return "Unknown command. Type <b>/help</b> for a list of commands.";
    }
  }
  // Pattern rules
  for (const rule of rules) {
    if (rule.pattern.test(message)) {
      const replies = Array.isArray(rule.reply) ? rule.reply : [rule.reply];
      const reply = randomFrom(replies);
      if (rule.pattern.toString().includes("/joke/")) {
        lastBotWasJoke = true;
        jokeFollowupPending = true;
      } else {
        lastBotWasJoke = false;
        jokeFollowupPending = false;
      }
      botHistory.push(reply);
      return reply;
    }
  }

  // Fallback: Markov chain or random fallback or Rickroll
  lastBotWasJoke = false;
  jokeFollowupPending = false;

  // 1 in 10 chance to Rickroll if user said something unrecognized (just for fun)
  if (Math.random() < 0.10) {
    return embedYouTube("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  }
  // 1 in 2 chance to say a random fallback answer
  if (Math.random() < 0.5) {
    return randomFrom(fallbackReplies);
  }
  const markovText = markovReply();
  botHistory.push(markovText);
  return markovText;
}

function addMessage(sender, text) {
  if(!text) return;
  const msg = document.createElement('div');
  msg.className = 'msg ' + sender;
  msg.innerHTML = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function handleSend() {
  const userMsg = input.value.trim();
  if (!userMsg) return;
  addMessage("user", escapeHTML(userMsg));
  userHistory.push(userMsg);
  setTimeout(() => {
    const botReply = getBotReply(userMsg);
    if(botReply) addMessage("bot", botReply);
  }, 350);
  input.value = '';
}

send.onclick = handleSend;
input.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSend();
});

addMessage("bot", "👋 Hi! I'm <b>MossAI v3.02</b>. Type <b>/help</b> to see what I can do! Now with memory, music news, more /explain topics, video embedding, and smart joke follow-ups 🚀");
