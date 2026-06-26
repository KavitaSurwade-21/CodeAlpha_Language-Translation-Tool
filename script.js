const inputText  = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const translateBtn = document.getElementById('translateBtn');
const charCount  = document.getElementById('charCount');
const charBar    = document.querySelector('.char-count');
const swapBtn    = document.getElementById('swapBtn');
const clearBtn   = document.getElementById('clearBtn');
const copyBtn    = document.getElementById('copyBtn');
const downloadBtn= document.getElementById('downloadBtn');
const speakInput = document.getElementById('speakInput');
const speakOutput= document.getElementById('speakOutput');
const darkToggle = document.getElementById('darkToggle');
const historyToggle = document.getElementById('historyToggle');
const historyPanel  = document.getElementById('historyPanel');
const historyList   = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const outputLangLabel = document.getElementById('outputLangLabel');
const toast = document.getElementById('toast');

let translationHistory = JSON.parse(localStorage.getItem('tl_history') || '[]');
let toastTimer;

// ─── Dark Mode ───────────────────────────────────────
const html = document.documentElement;
const savedTheme = localStorage.getItem('tl_theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

darkToggle.addEventListener('click', () => {
  const cur = html.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('tl_theme', next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  darkToggle.innerHTML = theme === 'dark'
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// ─── Character Counter ────────────────────────────────
inputText.addEventListener('input', () => {
  const len = inputText.value.length;
  charCount.textContent = len;
  charBar.classList.toggle('warn', len > 4000 && len <= 4800);
  charBar.classList.toggle('limit', len > 4800);
  if (len === 0) resetOutput();
});

// ─── Translate ────────────────────────────────────────
translateBtn.addEventListener('click', doTranslate);
inputText.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) doTranslate();
});

async function doTranslate() {
  const text = inputText.value.trim();
  if (!text) { showToast('Please enter some text first', 'error'); return; }

  setLoading(true);
  try {
    const res = await fetch('/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source_lang: sourceLang.value,
        target_lang: targetLang.value
      })
    });
    const data = await res.json();

    if (data.success) {
      outputText.textContent = data.translated;
      const langName = targetLang.options[targetLang.selectedIndex].text;
      outputLangLabel.textContent = langName;
      saveHistory(text, data.translated);
      showToast('Translated successfully!', 'success');
    } else {
      showToast('Translation failed: ' + data.error, 'error');
    }
  } catch (e) {
    showToast('Network error. Is Flask running?', 'error');
  }
  setLoading(false);
}

function setLoading(state) {
  translateBtn.classList.toggle('loading', state);
  translateBtn.disabled = state;
}

function resetOutput() {
  outputText.innerHTML = '<span class="placeholder-text">Translation will appear here...</span>';
  outputLangLabel.textContent = '';
}

// ─── Swap Languages ───────────────────────────────────
swapBtn.addEventListener('click', () => {
  const srcVal = sourceLang.value;
  const tgtVal = targetLang.value;

  if (srcVal === 'auto') {
    showToast('Cannot swap when source is Auto-detect', 'error');
    return;
  }
  sourceLang.value = tgtVal;
  targetLang.value = srcVal;

  const currentInput = inputText.value;
  const currentOutput = outputText.textContent;
  if (currentOutput && !currentOutput.includes('Translation will appear')) {
    inputText.value = currentOutput;
    charCount.textContent = inputText.value.length;
    resetOutput();
  }
  showToast('Languages swapped!');
});

// ─── Clear ────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  charCount.textContent = '0';
  charBar.classList.remove('warn', 'limit');
  resetOutput();
});

// ─── Copy Translation ─────────────────────────────────
copyBtn.addEventListener('click', () => {
  const text = outputText.textContent;
  if (!text || text.includes('Translation will appear')) {
    showToast('Nothing to copy yet', 'error'); return;
  }
  navigator.clipboard.writeText(text)
    .then(() => showToast('Copied to clipboard!', 'success'))
    .catch(() => showToast('Copy failed', 'error'));
});

// ─── Download Translation ─────────────────────────────
downloadBtn.addEventListener('click', () => {
  const text = outputText.textContent;
  if (!text || text.includes('Translation will appear')) {
    showToast('Nothing to download yet', 'error'); return;
  }
  const original = inputText.value;
  const langName = targetLang.options[targetLang.selectedIndex].text;
  const content  = `LinguaFlow Translation\n${'─'.repeat(40)}\nTarget Language: ${langName}\n\nOriginal:\n${original}\n\nTranslation:\n${text}\n\nDate: ${new Date().toLocaleString()}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `translation_${langName.replace(/\s+/g,'_')}_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Downloaded!', 'success');
});

// ─── Text to Speech ───────────────────────────────────
speakInput.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) { showToast('Nothing to speak', 'error'); return; }
  speak(text, sourceLang.value === 'auto' ? 'en' : sourceLang.value);
});

speakOutput.addEventListener('click', () => {
  const text = outputText.textContent.trim();

  if (!text || text.includes('Translation will appear')) {
    showToast('Nothing to speak yet', 'error');
    return;
  }

  speak(text, targetLang.value);
});
function speak(text, langCode) {
  if (!window.speechSynthesis) {
    showToast('TTS not supported', 'error');
    return;
  }

  speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);

  const voices = speechSynthesis.getVoices();

  // language map (IMPORTANT)
  const map = {
    en: "en-US",
    hi: "hi-IN",
    mr: "mr-IN",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    it: "it-IT",
    ja: "ja-JP",
    ko: "ko-KR",
    ru: "ru-RU"
  };

  utter.lang = map[langCode] || "en-US";

  // voice select karo (important fix)
  const voice = voices.find(v =>
    v.lang.toLowerCase().includes(utter.lang.toLowerCase())
  );

  if (voice) {
    utter.voice = voice;
  }

  utter.volume = 1;
  utter.rate = 1;
  utter.pitch = 1;

  speechSynthesis.speak(utter);
}
// ─── History ──────────────────────────────────────────
historyToggle.addEventListener('click', () => {
  historyPanel.classList.toggle('open');
});

clearHistoryBtn.addEventListener('click', () => {
  translationHistory = [];
  localStorage.removeItem('tl_history');
  renderHistory();
  showToast('History cleared');
});

function saveHistory(original, translated) {
  const entry = {
    original,
    translated,
    from: sourceLang.options[sourceLang.selectedIndex].text,
    to:   targetLang.options[targetLang.selectedIndex].text,
    time: new Date().toLocaleString()
  };
  translationHistory.unshift(entry);
  if (translationHistory.length > 20) translationHistory.pop();
  localStorage.setItem('tl_history', JSON.stringify(translationHistory));
  renderHistory();
}

function renderHistory() {
  if (translationHistory.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No translations yet.</p>';
    return;
  }
  historyList.innerHTML = translationHistory.map((item, i) => `
    <div class="history-item" data-index="${i}">
      <div class="history-original">${escHtml(item.original)}</div>
      <div class="history-translated">${escHtml(item.translated)}</div>
      <div class="history-meta">${item.from} → ${item.to} &nbsp;·&nbsp; ${item.time}</div>
    </div>
  `).join('');

  historyList.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', () => {
      const item = translationHistory[el.dataset.index];
      inputText.value = item.original;
      charCount.textContent = item.original.length;
      outputText.textContent = item.translated;
      outputLangLabel.textContent = item.to;
      historyPanel.classList.remove('open');
      showToast('Loaded from history');
    });
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Toast ────────────────────────────────────────────
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = 'toast' + (type ? ' ' + type : '');
  requestAnimationFrame(() => toast.classList.add('show'));
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── Init ─────────────────────────────────────────────
renderHistory();