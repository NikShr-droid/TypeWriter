// ── Sprocket teeth ──
const rollTeeth = document.getElementById('rollTeeth');
for (let i = 0; i < 70; i++) {
  const t = document.createElement('div');
  t.className = 'roll-tooth';
  rollTeeth.appendChild(t);
}

// ── Audio ──
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playKeyClick() {
  try {
    const ctx = getCtx(), now = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random()*2-1)*Math.pow(1-i/data.length,2.5);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18+Math.random()*0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now+0.08);
    const filt = ctx.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=800+Math.random()*600; filt.Q.value=0.7;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start(now); src.stop(now+0.09);
  } catch(e) {}
}
function playReturnBell() {
  try {
    const ctx = getCtx(), now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type='sine'; osc.frequency.setValueAtTime(1046,now); osc.frequency.exponentialRampToValueAtTime(880,now+0.4);
    gain.gain.setValueAtTime(0.18,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.75);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now+0.75);
  } catch(e) {}
}
function playBackspace() {
  try {
    const ctx = getCtx(), now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type='sawtooth'; osc.frequency.value=110+Math.random()*50;
    gain.gain.setValueAtTime(0.06,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.06);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now+0.06);
  } catch(e) {}
}
function playErrorDing() {
  try {
    const ctx = getCtx(), now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type='square'; osc.frequency.value=200+Math.random()*30;
    gain.gain.setValueAtTime(0.07,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.12);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now+0.12);
  } catch(e) {}
}

// ── App state ──
let appMode = 'notes'; // 'notes' | 'practice'

// ── Shared refs ──
const paperDisplay = document.getElementById('paperDisplay');
const hiddenInput  = document.getElementById('hiddenInput');
const carriageArm  = document.getElementById('carriageArm');
const armHead      = document.getElementById('armHead');

// ── Focus ──
function focusInput() { hiddenInput.focus(); }
document.getElementById('paperWrap').addEventListener('click', () => {
  if (document.getElementById('resultsOverlay').classList.contains('visible')) return;
  focusInput();
});

// ── Carriage ──
const CHAR_W = 11.8, LEFT_PAD = 20;
function updateCarriage(col) {
  const wrapW = document.getElementById('carriageWrap').offsetWidth || 620;
  const x = Math.min(LEFT_PAD + col * CHAR_W, wrapW - 26);
  carriageArm.style.left = x + 'px';
}
let strikeTimeout = null;
function strikeArm() {
  armHead.classList.add('striking');
  carriageArm.style.marginTop = '-5px';
  clearTimeout(strikeTimeout);
  strikeTimeout = setTimeout(() => { carriageArm.style.marginTop='0px'; armHead.classList.remove('striking'); }, 90);
}
function spawnInkDot() {
  if (Math.random() > 0.4) return;
  const armRect = carriageArm.getBoundingClientRect();
  const dispRect = paperDisplay.getBoundingClientRect();
  const dot = document.createElement('div');
  dot.className = 'ink-dot';
  const size = 1 + Math.random() * 2.5;
  dot.style.cssText = `width:${size}px;height:${size}px;left:${armRect.left-dispRect.left+5+(Math.random()-.5)*8}px;top:${armRect.bottom-dispRect.top-4+(Math.random()-.5)*6}px;`;
  paperDisplay.appendChild(dot);
  setTimeout(() => dot.remove(), 600);
}
function animatePaper(type) {
  paperDisplay.classList.remove('thud','feed');
  void paperDisplay.offsetWidth;
  paperDisplay.classList.add(type);
  setTimeout(() => paperDisplay.classList.remove(type), 250);
}

// ════════════════════════════════════
// ── NOTES MODE ──
// ════════════════════════════════════
let text = '';
let isTyping = false;
let typingTimer = null;

function rebuildDisplay(newIdx = -1) {
  while (paperDisplay.firstChild) paperDisplay.removeChild(paperDisplay.firstChild);
  if (!text.length) {
    const ph = document.createElement('span');
    ph.className = 'placeholder-text';
    ph.textContent = 'Begin typing your note…\n\nEach keystroke leaves its mark.';
    paperDisplay.appendChild(ph);
    updateCarriage(0);
    appendCursor();
    return;
  }
  let col = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\n') { paperDisplay.appendChild(document.createElement('br')); col = 0; }
    else {
      const span = document.createElement('span');
      span.className = 'char';
      if (i === newIdx) {
        span.classList.add('new');
        const r = Math.random();
        if (r < 0.13) span.classList.add('smear');
        else if (r < 0.22) span.classList.add('heavy');
        else if (r < 0.30) span.classList.add('faint');
      }
      span.textContent = ch;
      paperDisplay.appendChild(span);
      col++;
    }
  }
  const lines = text.split('\n');
  updateCarriage(lines[lines.length-1].length);
  appendCursor();
}
function appendCursor() {
  const cur = document.createElement('span');
  cur.className = 'cursor' + (isTyping ? ' typing' : '');
  paperDisplay.appendChild(cur);
}
function pulseTyping() {
  isTyping = true;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    isTyping = false;
    const cur = paperDisplay.querySelector('.cursor');
    if (cur) cur.className = 'cursor';
  }, 900);
}

// ════════════════════════════════════
// ── PRACTICE MODE ──
// ════════════════════════════════════
const PROMPTS = [
  "The quick brown fox jumps over the lazy dog near the river bank.",
  "A stitch in time saves nine, but practice makes a typist perfect.",
  "Pack my box with five dozen liquor jugs before the storm arrives.",
  "How vexingly quick daft zebras jump across the frozen plain.",
  "The five boxing wizards jump quickly onto the old wooden stage.",
  "Bright copper kettles and warm woollen mittens bring simple joys.",
  "All good things must come to an end, though great things linger.",
  "Sphinx of black quartz, judge my vow before the clock strikes ten.",
  "The early bird catches the worm but the second mouse gets the cheese.",
  "Two roads diverged in a wood, and I took the one less travelled.",
  "In the beginning was the word, and the word was typed by hand.",
  "Sixty zippers were quickly picked from the woven jute bag on the shelf.",
  "Crazy Fredrick bought many very exquisite opal jewels from the vendor.",
  "The job requires extra pluck and zeal from every young wage earner.",
  "We promptly judged antique ivory buckles for the next prize showcase.",
];

let practiceTarget  = '';
let practiceTyped   = '';    // what the user has typed so far
let practiceErrors  = 0;     // cumulative wrong keystrokes
let practiceStart   = null;  // Date.now() when first key pressed
let practiceActive  = false;

// Time mode: 0 = free, 15/30/60 = seconds
let practiceTimeMode = 0;
let countdownInterval = null;
let timeRemaining = 0;

function setTimeMode(secs) {
  practiceTimeMode = secs;
  ['0','15','30','60'].forEach(v => {
    document.getElementById('timBtn' + v).classList.toggle('active', String(secs) === v);
  });
  // Show/hide countdown widget
  document.getElementById('countdownWrap').classList.toggle('visible', secs > 0);
  if (secs === 0) {
    document.getElementById('countdownClock').textContent = '—';
    document.getElementById('countdownClock').classList.remove('urgent');
  }
  // Restart with new mode
  startPracticeRound();
}

function startCountdown() {
  clearInterval(countdownInterval);
  if (practiceTimeMode === 0) return;
  timeRemaining = practiceTimeMode;
  renderClock();
  countdownInterval = setInterval(() => {
    timeRemaining--;
    renderClock();
    if (timeRemaining <= 0) {
      clearInterval(countdownInterval);
      clearInterval(wpsDecayInterval);
      practiceActive = false;
      setTimeout(showPracticeResults, 200);
    }
  }, 1000);
}

function renderClock() {
  const el = document.getElementById('countdownClock');
  el.textContent = timeRemaining + 's';
  el.classList.toggle('urgent', timeRemaining <= 5 && timeRemaining > 0);
}

// Live WPS tracking (rolling 3s window on spaces)
let wpsTimestamps = [];
let wpsDecayInterval = null;

function startPracticeRound() {
  // Hide results
  document.getElementById('resultsOverlay').classList.remove('visible');
  clearInterval(countdownInterval);
  // Pick a random prompt (different from last)
  let next;
  do { next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]; } while (next === practiceTarget && PROMPTS.length > 1);
  practiceTarget  = next;
  practiceTyped   = '';
  practiceErrors  = 0;
  practiceStart   = null;
  practiceActive  = true;
  wpsTimestamps   = [];
  clearInterval(wpsDecayInterval);
  // Reset clock display without starting yet (starts on first keypress)
  if (practiceTimeMode > 0) {
    timeRemaining = practiceTimeMode;
    renderClock();
    document.getElementById('countdownClock').classList.remove('urgent');
  }
  updatePracticeStats();
  renderPracticeDisplay();
  focusInput();
}

function resetPractice() {
  if (practiceTarget) startPracticeRound();
}

function renderPracticeDisplay() {
  while (paperDisplay.firstChild) paperDisplay.removeChild(paperDisplay.firstChild);

  const wrap = document.createElement('div');
  wrap.className = 'practice-target';

  for (let i = 0; i < practiceTarget.length; i++) {
    const span = document.createElement('span');
    span.className = 'tc';
    const ch = practiceTarget[i];

    if (i < practiceTyped.length) {
      // Already typed
      if (practiceTyped[i] === ch) {
        span.classList.add('correct');
      } else {
        span.classList.add('wrong');
        span.textContent = ch; // show target char in red
      }
    } else if (i === practiceTyped.length) {
      span.classList.add('pending', 'cursor-here');
    } else {
      span.classList.add('pending');
    }

    if (i === practiceTyped.length - 1) span.classList.add('new');
    span.textContent = ch;
    wrap.appendChild(span);
  }

  paperDisplay.appendChild(wrap);

  // Move carriage to current position
  const curLine = practiceTarget.slice(0, practiceTyped.length).split('\n');
  updateCarriage(curLine[curLine.length-1].length);
}

function handlePracticeKey(key) {
  if (!practiceActive) return;
  if (document.getElementById('resultsOverlay').classList.contains('visible')) return;

  // Start timer on first keystroke
  if (practiceStart === null) {
    practiceStart = Date.now();
    startCountdown();
  }

  if (key === 'Backspace') {
    if (practiceTyped.length === 0) return;
    playBackspace();
    practiceTyped = practiceTyped.slice(0, -1);
    renderPracticeDisplay();
    animatePaper('thud');
    return;
  }

  if (key.length > 1) return; // ignore arrows etc

  // Only advance if within target bounds
  if (practiceTyped.length >= practiceTarget.length) return;

  const expected = practiceTarget[practiceTyped.length];
  const correct  = key === expected;

  strikeArm();
  animatePaper('thud');

  if (correct) {
    playKeyClick();
    spawnInkDot();
    if (key === ' ') {
      const now = Date.now();
      wpsTimestamps.push(now);
      wpsTimestamps = wpsTimestamps.filter(t => now - t < 3000);
      clearInterval(wpsDecayInterval);
      wpsDecayInterval = setInterval(tickWPSDecay, 200);
    }
  } else {
    playErrorDing();
    practiceErrors++;
  }

  practiceTyped += key;

  // Flash new char
  renderPracticeDisplay();
  // Add 'new' class to the just-typed span
  const spans = paperDisplay.querySelectorAll('.tc');
  const idx = practiceTyped.length - 1;
  if (spans[idx]) spans[idx].classList.add('new');

  updatePracticeStats();

  // Completion check
  if (practiceTyped.length === practiceTarget.length) {
    clearInterval(wpsDecayInterval);
    clearInterval(countdownInterval);
    practiceActive = false;
    setTimeout(showPracticeResults, 400);
  }
}

function tickWPSDecay() {
  const now = Date.now();
  wpsTimestamps = wpsTimestamps.filter(t => now - t < 3000);
  updatePracticeStats();
  if (wpsTimestamps.length === 0) clearInterval(wpsDecayInterval);
}

function calcWPS() {
  const now = Date.now();
  const recent = wpsTimestamps.filter(t => now - t < 3000);
  return recent.length / 3;
}

function calcAccuracy() {
  if (practiceTyped.length === 0) return null;
  const correct = practiceTyped.split('').filter((ch, i) => ch === practiceTarget[i]).length;
  return Math.round((correct / practiceTyped.length) * 100);
}

function updatePracticeStats() {
  const wps = calcWPS();
  const acc = calcAccuracy();
  const progress = practiceTarget.length ? (practiceTyped.length / practiceTarget.length) * 100 : 0;

  const wpsEl = document.getElementById('statWPS');
  wpsEl.textContent = wps.toFixed(1);
  wpsEl.className = 'stat-value' + (wps >= 2.5 ? ' good' : wps > 0 ? '' : '');

  const accEl = document.getElementById('statAcc');
  accEl.textContent = acc !== null ? acc + '%' : '—';
  accEl.className = 'stat-value' + (acc === null ? '' : acc >= 95 ? ' good' : acc < 80 ? ' warn' : '');

  const errEl = document.getElementById('statErrors');
  errEl.textContent = practiceErrors;
  errEl.className = 'stat-value' + (practiceErrors > 5 ? ' warn' : practiceErrors === 0 ? ' good' : '');

  document.getElementById('progressFill').style.width = progress + '%';
}

function showPracticeResults() {
  const elapsed = practiceStart ? (Date.now() - practiceStart) / 1000 : 0;
  // In timed mode, use the time limit as elapsed if timer ran out
  const effectiveTime = practiceTimeMode > 0 ? Math.min(elapsed, practiceTimeMode) : elapsed;
  // Count correctly typed words (complete words only)
  const typedWords = practiceTyped.trim().split(/\s+/).filter(Boolean).length;
  const wpm = effectiveTime > 0 ? Math.round((typedWords / effectiveTime) * 60) : 0;
  const acc = calcAccuracy() ?? 100;
  const charsTyped = practiceTyped.length;

  const timedOut = practiceTimeMode > 0 && timeRemaining <= 0;
  const titleText = timedOut ? `— Time's Up! —` : '— Round Complete —';
  document.querySelector('.results-title').textContent = titleText;

  const msgs = {
    perfect: ["Flawless. The keys sing for you.", "Not a single error. Remarkable.", "Pure perfection — the ribbon weeps with joy."],
    great:   ["Sharp fingers, sharper mind.", "A fine showing at the keys.", "The machine approves of your pace."],
    good:    ["Getting there. Keep at it.", "Solid work. A few more rounds.", "The typewriter is warming to you."],
    poor:    ["Slow down, find your rhythm.", "The keys resist haste. Try again.", "Even great typists needed practice once."],
  };
  const tier = acc === 100 ? 'perfect' : acc >= 90 ? 'great' : acc >= 75 ? 'good' : 'poor';
  const msg  = msgs[tier][Math.floor(Math.random() * msgs[tier].length)];

  document.getElementById('resultsGrid').innerHTML = `
    <div class="result-stat">
      <div class="result-num accent">${wpm}</div>
      <div class="result-lbl">WPM</div>
    </div>
    <div class="result-stat">
      <div class="result-num ${acc >= 95 ? 'good' : ''}">${acc}%</div>
      <div class="result-lbl">Accuracy</div>
    </div>
    <div class="result-stat">
      <div class="result-num">${practiceErrors}</div>
      <div class="result-lbl">Errors</div>
    </div>
    <div class="result-stat">
      <div class="result-num">${effectiveTime.toFixed(1)}s</div>
      <div class="result-lbl">Time</div>
    </div>
    ${practiceTimeMode > 0 ? `<div class="result-stat"><div class="result-num">${charsTyped}</div><div class="result-lbl">Chars</div></div>` : ''}
  `;
  document.getElementById('resultsMsg').textContent = msg;
  document.getElementById('resultsOverlay').classList.add('visible');
}

// ════════════════════════════════════
// ── MODE SWITCHING ──
// ════════════════════════════════════
function setMode(mode) {
  appMode = mode;
  document.getElementById('btnNoteMode').classList.toggle('active', mode === 'notes');
  document.getElementById('btnPracticeMode').classList.toggle('active', mode === 'practice');
  document.getElementById('notesControls').style.display   = mode === 'notes' ? '' : 'none';
  document.getElementById('practiceControls').style.display = mode === 'practice' ? 'flex' : 'none';
  document.getElementById('practiceStats').classList.toggle('visible', mode === 'practice');
  document.getElementById('notesSection').style.display    = mode === 'notes' ? '' : 'none';
  document.getElementById('resultsOverlay').classList.remove('visible');

  if (mode === 'notes') {
    clearInterval(countdownInterval);
    rebuildDisplay();
  } else {
    practiceTarget = '';
    practiceTyped  = '';
    startPracticeRound();
  }
  focusInput();
}

// ════════════════════════════════════
// ── UNIFIED KEYBOARD HANDLER ──
// ════════════════════════════════════
hiddenInput.addEventListener('keydown', (e) => {
  if (appMode === 'notes') {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); saveNote(); return; }
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (!text.length) return;
      playBackspace(); text = text.slice(0,-1); rebuildDisplay(); animatePaper('thud'); return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      playReturnBell(); text += '\n'; rebuildDisplay(text.length-1); animatePaper('feed'); pulseTyping(); return;
    }
    if (e.key.length > 1) return;
    e.preventDefault();
    playKeyClick(); strikeArm(); text += e.key; rebuildDisplay(text.length-1); spawnInkDot(); animatePaper('thud'); pulseTyping();
  } else {
    if (e.key === 'Backspace') { e.preventDefault(); handlePracticeKey('Backspace'); return; }
    if (e.key.length > 1) return;
    e.preventDefault();
    handlePracticeKey(e.key);
  }
});

hiddenInput.addEventListener('input', () => {
  const val = hiddenInput.value;
  if (!val) return;
  hiddenInput.value = '';
  if (appMode === 'notes') {
    for (const ch of val) {
      if (ch === '\n') { playReturnBell(); text += '\n'; animatePaper('feed'); }
      else { playKeyClick(); strikeArm(); text += ch; animatePaper('thud'); }
    }
    rebuildDisplay(text.length-1); spawnInkDot(); pulseTyping();
  } else {
    for (const ch of val) handlePracticeKey(ch);
  }
});

// ════════════════════════════════════
// ── NOTES CRUD ──
// ════════════════════════════════════
let notes = [];
try { notes = JSON.parse(localStorage.getItem('tw_notes') || '[]'); } catch(e) {}
function saveToStorage() { try { localStorage.setItem('tw_notes', JSON.stringify(notes)); } catch(e) {} }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
function saveNote() {
  const body = text.trim();
  if (!body) { showToast('Nothing to save yet…'); return; }
  const title = document.getElementById('noteTitle').value.trim() || 'Untitled Memo';
  notes.unshift({ id: Date.now(), title, body, date: new Date().toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) });
  saveToStorage(); renderNotes(); clearNote(true); showToast('Note filed away ✓');
}
function clearNote(silent = false) {
  text = ''; rebuildDisplay(); document.getElementById('noteTitle').value = '';
  focusInput(); if (!silent) showToast('Page cleared');
}
function deleteNote(id) {
  notes = notes.filter(n => n.id !== id); saveToStorage(); renderNotes();
}
function renderNotes() {
  const grid = document.getElementById('notesGrid');
  const count = document.getElementById('noteCount');
  count.textContent = notes.length ? `${notes.length} note${notes.length>1?'s':''}` : '';
  document.getElementById('btnExportAll').style.display = notes.length ? '' : 'none';
  if (!notes.length) { grid.innerHTML = '<div class="empty-state">No notes yet.<br>Roll in a fresh sheet and start typing.</div>'; return; }
  grid.innerHTML = notes.map(n => {
    const clipRotate = (Math.random() * 30 - 15).toFixed(1);
    const clipRight  = (12 + Math.random() * 16).toFixed(1);
    const clipTop    = (-20 + Math.random() * 8).toFixed(1);
    return `
    <div class="note-card">
      <svg class="note-clip" style="top:${clipTop}px;right:${clipRight}px;transform:rotate(${clipRotate}deg)" viewBox="0 0 18 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 2 C5 2 2 5 2 9 L2 28 C2 32 5 35 9 35 C13 35 16 32 16 28 L16 11 C16 8 14 6 11 6 C8 6 6 8 6 11 L6 27 C6 29 7.5 30 9 30 C10.5 30 12 29 12 27 L12 12"
          stroke="#8a7a60" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="note-title">${escHtml(n.title)}</div>
      <div class="note-body">${escHtml(n.body)}</div>
      <div class="note-footer">
        <span class="note-date">${n.date}</span>
        <div class="note-actions">
          <button class="note-icon-btn export" onclick="exportNote(${n.id},'txt')" title="Download as .txt">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5 1.5 L6.5 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M3.5 6.5 L6.5 9.5 L9.5 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 11.5 L11 11.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="note-icon-btn delete" onclick="deleteNote(${n.id})" title="Discard note">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `}).join('');
}
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function downloadFile(filename, content) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function sanitizeFilename(title) {
  return title.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_').slice(0, 60) || 'note';
}

function exportNote(id, format) {
  const n = notes.find(n => n.id === id);
  if (!n) return;
  const fname = sanitizeFilename(n.title);
  if (format === 'txt') {
    const content = `${n.title}\n${'─'.repeat(n.title.length)}\n${n.date}\n\n${n.body}`;
    downloadFile(`${fname}.txt`, content);
  } else {
    const content = `# ${n.title}\n\n*${n.date}*\n\n${n.body}`;
    downloadFile(`${fname}.md`, content);
  }
  showToast(`Exported "${n.title}" as .${format}`);
}

function exportAllNotes() {
  if (!notes.length) return;
  // Bundle all as a single .md file, newest first
  const content = notes.map(n =>
    `# ${n.title}\n\n*${n.date}*\n\n${n.body}`
  ).join('\n\n---\n\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`typewriter-notes-${date}.md`, content);
  showToast(`Exported ${notes.length} note${notes.length > 1 ? 's' : ''}`);
}

// ── Init ──
rebuildDisplay();
renderNotes();
setTimeout(focusInput, 100);
