const chat = document.getElementById('chat');
const input = document.getElementById('input');
const send = document.getElementById('send');

// "Memory" for previous user messages
const memory = [];

// Pattern-based rules
const rules = [
  { pattern: /hello|hi|hey/i, reply: ["Hello!", "Hey there!", "Hi! How's it going?"] },
  { pattern: /how are you/i, reply: ["I'm just code, but I'm doing great! How about you?"] },
  { pattern: /your name|who are you/i, reply: ["I'm your clever browser chatbot.", "People call me Chatty!"] },
  { pattern: /help|can you/i, reply: ["Ask me anything, or just chat with me. I'm learning!"] },
  { pattern: /weather/i, reply: ["I can't check the weather, but it looks nice in here!"] },
  { pattern: /joke/i, reply: ["Why did the web developer go broke? Because he used up all his cache!", "What do you call a computer that sings? A Dell!"] },
  { pattern: /bye|goodbye|see you/i, reply: ["Goodbye!", "See you later!", "Bye! Come back soon!"] },
  { pattern: /who made you|who created you/i, reply: ["I was made by Mossboss10 with a little help from Copilot!"] }
];

// Markov chain source text (short example)
const markovSource = `
Welcome to the world of code and creativity.
Frontend chatbots are fun and clever.
JavaScript makes everything possible in the browser.
Ask me a question and let's chat about anything.
Creativity and curiosity drive technology forward.
`;

// Build Markov chain model
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

// Intent detection (very basic)
function detectIntent(text) {
  if(/(how|what|why|where|when|who)/i.test(text) && text.endsWith('?')) return 'question';
  if(/joke/i.test(text)) return 'joke';
  if(/bye|goodbye/i.test(text)) return 'bye';
  if(/name|who are you/i.test(text)) return 'identity';
  if(/hello|hi|hey/i.test(text)) return 'greeting';
  return 'unknown';
}

function getBotReply(message) {
  // Try pattern rules
  for (const rule of rules) {
    if (rule.pattern.test(message)) {
      const replies = Array.isArray(rule.reply) ? rule.reply : [rule.reply];
      return replies[Math.floor(Math.random()*replies.length)];
    }
  }
  // Intent-based extra responses
  const intent = detectIntent(message);
  if(intent === 'question') {
    // Try to use memory for context
    if(memory.length > 0) {
      return "Earlier you said: \"" + memory[memory.length-1] + "\". Can you tell me more?";
    } else {
      return "That's an interesting question! What do you think?";
    }
  }
  // Fallback to Markov chain for creativity
  return markovReply();
}

function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.innerHTML = `<b>${sender}:</b> ${text}`;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function handleSend() {
  const userMsg = input.value.trim();
  if (!userMsg) return;
  addMessage("You", userMsg);
  memory.push(userMsg);
  const botReply = getBotReply(userMsg);
  setTimeout(() => addMessage("Bot", botReply), 500);
  input.value = '';
}

send.onclick = handleSend;
input.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSend();
});

// Initial greeting
addMessage("Bot", "Hi! I'm your clever browser chatbot. Say hello or ask me anything!");
