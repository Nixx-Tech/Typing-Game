const textDisplayEl = document.getElementById("text-display");
const textInputEl = document.getElementById("text-input");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const resultsRestartBtn = document.getElementById("results-restart-btn");
const difficultySelect = document.getElementById("difficulty-select");
const durationSelect = document.getElementById("duration-select");
const countdownEl = document.getElementById("countdown");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const charsEl = document.getElementById("chars");
const resultsSection = document.getElementById("results");
const finalWpmEl = document.getElementById("final-wpm");
const finalAccuracyEl = document.getElementById("final-accuracy");

// A simple word list grouped by difficulty
const WORD_BANK = {
  easy: [
    "cat",
    "sun",
    "dog",
    "tree",
    "book",
    "code",
    "line",
    "blue",
    "sky",
    "fish",
    "game",
    "play",
    "home",
    "road",
    "time",
    "hand",
    "fast",
    "soft",
    "kind",
    "nixx",
  ],
  medium: [
    "typing",
    "keyboard",
    "monitor",
    "window",
    "editor",
    "moment",
    "random",
    "cursor",
    "language",
    "future",
    "project",
    "feature",
    "awesome",
    "practice",
    "functional",
    "pattern",
    "network",
    "terminal",
    "battery",
    "silence",
  ],
  hard: [
    "synchronous",
    "asynchronous",
    "architecture",
    "configuration",
    "initialization",
    "characteristic",
    "extraordinary",
    "responsibility",
    "implementation",
    "approximation",
    "miscommunication",
    "representation",
    "compatibility",
    "sophisticated",
    "customization",
    "virtualization",
    "procrastination",
    "cryptographic",
    "indistinguishable",
    "unpredictability",
  ],
};

let targetText = "";
let timerId = null;
let startTime = null;
let testDurationSeconds = 60;
let testRunning = false;

function sampleWords(difficulty, minChars) {
  const words = WORD_BANK[difficulty] || WORD_BANK.medium;
  const pieces = [];
  let total = 0;

  // Shuffle a shallow copy
  const shuffled = words
    .slice()
    .sort(() => (Math.random() > 0.5 ? 1 : -1));

  while (total < minChars) {
    for (const w of shuffled) {
      pieces.push(w);
      total += w.length + 1;
      if (total >= minChars) break;
    }
  }

  return pieces.join(" ");
}

function prepareText() {
  const difficulty = difficultySelect.value;
  // Roughly 5 chars per word, 5 words per WPM, duration seconds / 60 minutes
  const estimatedChars = Math.round((testDurationSeconds / 60) * 5 * 5 * 1.4);
  targetText = sampleWords(difficulty, estimatedChars);

  textDisplayEl.innerHTML = "";
  for (const ch of targetText) {
    const span = document.createElement("span");
    span.textContent = ch;
    span.classList.add("char");
    textDisplayEl.appendChild(span);
  }

  markCurrentIndex(0);
  updateStats(0, 0, 0);
}

function markCurrentIndex(index) {
  const spans = textDisplayEl.querySelectorAll(".char");
  spans.forEach((s) => s.classList.remove("current"));
  if (index >= 0 && index < spans.length) {
    spans[index].classList.add("current");
    const span = spans[index];
    span.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

function calculateStats(typedText, elapsedSeconds) {
  const spans = textDisplayEl.querySelectorAll(".char");
  const target = targetText;

  let correct = 0;
  let incorrect = 0;

  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    span.classList.remove("correct", "incorrect");

    const expectedChar = target[i] ?? "";
    const typedChar = typedText[i] ?? "";

    if (typedChar === "") {
      continue;
    }

    if (typedChar === expectedChar) {
      span.classList.add("correct");
      correct++;
    } else {
      span.classList.add("incorrect");
      incorrect++;
    }
  }

  const totalTyped = correct + incorrect;
  const accuracy = totalTyped === 0 ? 100 : Math.max(0, Math.round((correct / totalTyped) * 100));

  const minutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 1 / 60;
  const wpm = Math.round((correct / 5) / minutes);

  const nextIndex = Math.min(typedText.length, spans.length - 1);
  markCurrentIndex(nextIndex);

  return { correct, incorrect, accuracy, wpm, totalTyped };
}

function updateStats(wpm, accuracy, correct, incorrect) {
  wpmEl.textContent = String(wpm);
  accuracyEl.textContent = `${accuracy}%`;
  charsEl.textContent = `${correct + incorrect} / ${targetText.length}`;
}

function startTest() {
  if (testRunning) return;

  testDurationSeconds = parseInt(durationSelect.value, 10) || 60;
  countdownEl.textContent = `Time: ${testDurationSeconds}s`;
  prepareText();

  testRunning = true;
  startBtn.disabled = true;
  restartBtn.disabled = false;
  difficultySelect.disabled = true;
  durationSelect.disabled = true;
  resultsSection.hidden = true;

  textInputEl.disabled = false;
  textInputEl.value = "";
  textInputEl.focus();

  startTime = performance.now();
  timerId = window.setInterval(tick, 100);
}

function tick() {
  const now = performance.now();
  const elapsed = (now - startTime) / 1000;
  const remaining = Math.max(0, testDurationSeconds - elapsed);

  countdownEl.textContent = `Time: ${Math.ceil(remaining)}s`;

  const typedText = textInputEl.value;
  const stats = calculateStats(typedText, Math.max(elapsed, 0.1));
  updateStats(stats.wpm, stats.accuracy, stats.correct, stats.incorrect);

  if (remaining <= 0.05) {
    finishTest();
  }
}

function finishTest() {
  if (!testRunning) return;
  testRunning = false;

  if (timerId != null) {
    clearInterval(timerId);
    timerId = null;
  }

  textInputEl.disabled = true;
  startBtn.disabled = false;
  restartBtn.disabled = false;
  difficultySelect.disabled = false;
  durationSelect.disabled = false;

  const elapsed = testDurationSeconds;
  const typedText = textInputEl.value;
  const stats = calculateStats(typedText, Math.max(elapsed, 0.1));
  updateStats(stats.wpm, stats.accuracy, stats.correct, stats.incorrect);

  finalWpmEl.textContent = String(stats.wpm);
  finalAccuracyEl.textContent = `${stats.accuracy}%`;
  resultsSection.hidden = false;
}

function resetTest() {
  if (timerId != null) {
    clearInterval(timerId);
    timerId = null;
  }

  testRunning = false;
  textInputEl.value = "";
  textInputEl.disabled = true;

  startBtn.disabled = false;
  restartBtn.disabled = true;
  difficultySelect.disabled = false;
  durationSelect.disabled = false;
  resultsSection.hidden = true;

  testDurationSeconds = parseInt(durationSelect.value, 10) || 60;
  countdownEl.textContent = `Time: ${testDurationSeconds}s`;

  prepareText();
}

startBtn.addEventListener("click", startTest);
restartBtn.addEventListener("click", resetTest);
resultsRestartBtn.addEventListener("click", resetTest);

textInputEl.addEventListener("input", () => {
  if (!testRunning) return;
  const now = performance.now();
  const elapsed = (now - startTime) / 1000;
  const typedText = textInputEl.value;
  const stats = calculateStats(typedText, Math.max(elapsed, 0.1));
  updateStats(stats.wpm, stats.accuracy, stats.correct, stats.incorrect);
});

// Initialize UI with default text
resetTest();

