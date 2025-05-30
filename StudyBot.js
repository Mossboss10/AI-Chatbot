const chat = document.getElementById('chat2');
const input = document.getElementById('input2');
const send = document.getElementById('send2');

let state = { waitingForTopic: false };

function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = 'msg ' + sender;
  msg.innerHTML = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function handleSend() {
  const userMsg = input.value.trim();
  if (!userMsg) return;
  addMessage("user", userMsg);

  setTimeout(() => {
    const botReply = getBotReply(userMsg);
    if (botReply) addMessage("bot", botReply);
  }, 350);
  input.value = '';
}

send.onclick = handleSend;
input.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSend();
});

function getBotReply(message) {
  if (state.waitingForTopic) {
    state.waitingForTopic = false;
    // Example: Add more topics and answers here for your "pages"
    if (/germany.*world war one/i.test(message)) {
      return `<b>IGCSE History: Was Germany to blame for the start of World War One?</b><br>
      <ul>
        <li><b>Arguments for Germany being to blame:</b>
          <ul>
            <li>The "blank cheque" support to Austria-Hungary escalated the crisis.</li>
            <li>Germany’s Schlieffen Plan showed pre-existing war plans.</li>
            <li>Germany declared war on Russia and France first.</li>
            <li>Many historians highlight Germany’s aggressive foreign policy.</li>
          </ul>
        </li>
        <li><b>Arguments against:</b>
          <ul>
            <li>Alliances and tensions in Europe made war likely, not just Germany’s actions.</li>
            <li>Austria-Hungary and Serbia’s conflict was the spark.</li>
            <li>France and Russia also mobilized quickly.</li>
            <li>The Treaty of Versailles’ “war guilt” clause is now seen as too simplistic.</li>
          </ul>
        </li>
        <li><b>Conclusion:</b> Most modern historians agree blame was shared among several countries, not just Germany.</li>
      </ul>`;
    }
    // Add more topics here!
    return "Sorry, I don't have notes on that topic yet, but you can ask me about another one!";
  }

  if (/help me with my .*work|homework|assignment|project/i.test(message)) {
    state.waitingForTopic = true;
    return "What topic do you need help with?";
  }

  return "I'm your study assistant! Ask for homework help by saying, for example, 'help me with my history work'.";
}

// Welcome message for the study bot
addMessage("bot", "Hi! I'm your study assistant bot. Say 'help me with my [subject] work' to get started.");
