const textDisplayEl = document.getElementById("text-display");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const difficultySelect = document.getElementById("difficulty-select");
const countdownEl = document.getElementById("countdown");
const wpmEl = document.getElementById("wpm");
const bestWpmEl = document.getElementById("best-wpm");
const accuracyEl = document.getElementById("accuracy");
const charsEl = document.getElementById("chars");

// Word list by difficulty
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
let typedText = "";
let startTime = null;
let testRunning = false;
let highScoreWpm = Number(localStorage.getItem("typingHighScoreWpm") || "0");
let totalCorrect = 0;
let totalIncorrect = 0;
let totalExpectedChars = 0;

function generateChunk(difficulty, wordCount) {
  const words = WORD_BANK[difficulty] || WORD_BANK.medium;
  const picked = [];
  for (let i = 0; i < wordCount; i++) {
    const w = words[Math.floor(Math.random() * words.length)];
    picked.push(w);
  }
  return picked.join(" ");
}

function renderTargetText() {
  textDisplayEl.innerHTML = "";
  for (const ch of targetText) {
    const span = document.createElement("span");
    span.textContent = ch;
    span.classList.add("char");
    textDisplayEl.appendChild(span);
  }
  markCurrentIndex(0);
}

function prepareText() {
  const difficulty = difficultySelect.value;
  // Exactly 20 words at a time
  targetText = generateChunk(difficulty, 20);
  totalExpectedChars = targetText.length;
  renderTargetText();
  updateStats(0, 100, 0, 0);
}

function markCurrentIndex(index) {
  const spans = textDisplayEl.querySelectorAll(".char");
  spans.forEach((s) => s.classList.remove("current"));
  if (index >= 0 && index < spans.length) {
    spans[index].classList.add("current");
  }
}

function calculateStats(currentTypedText) {
  const spans = textDisplayEl.querySelectorAll(".char");
  const target = targetText;

  let correct = 0;
  let incorrect = 0;

  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    span.classList.remove("correct", "incorrect");

    const expectedChar = target[i] ?? "";
    const typedChar = currentTypedText[i] ?? "";

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
  const accuracy =
    totalTyped === 0 ? 100 : Math.max(0, Math.round((correct / totalTyped) * 100));

  const nextIndex = Math.min(currentTypedText.length, spans.length - 1);
  markCurrentIndex(nextIndex);

  return { correct, incorrect, accuracy, totalTyped };
}

function updateStats(wpm, accuracy, correct, incorrect) {
  wpmEl.textContent = String(wpm);
  if (wpm > highScoreWpm) {
    highScoreWpm = wpm;
    localStorage.setItem("typingHighScoreWpm", String(highScoreWpm));
  }
  bestWpmEl.textContent = String(highScoreWpm);
  accuracyEl.textContent = `${accuracy}%`;
  charsEl.textContent = `${correct + incorrect} / ${totalExpectedChars}`;
}

function startTest() {
  if (testRunning) return;

  countdownEl.textContent = "Endless mode · type as long as you like.";
  prepareText();

  testRunning = true;
  startBtn.disabled = true;
  restartBtn.disabled = false;
  difficultySelect.disabled = true;

  typedText = "";
  startTime = performance.now();
  textDisplayEl.focus();
}

function resetToIdle() {
  testRunning = false;
  typedText = "";
  startTime = null;
  totalCorrect = 0;
  totalIncorrect = 0;
  totalExpectedChars = 0;

  startBtn.disabled = false;
  restartBtn.disabled = true;
  difficultySelect.disabled = false;
  countdownEl.textContent = "Endless mode · click Start to begin.";

  prepareText();
}

function restartTest() {
  // Reset everything and start a fresh endless session.
  testRunning = false;
  typedText = "";
  startTime = null;
  totalCorrect = 0;
  totalIncorrect = 0;
  totalExpectedChars = 0;
  startBtn.disabled = false;
  startTest();
}

startBtn.addEventListener("click", startTest);
restartBtn.addEventListener("click", restartTest);

// Single main typing area: capture keystrokes on the display box
textDisplayEl.addEventListener("keydown", (e) => {
  if (!testRunning) return;

  // Ignore modifier combos
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return;
  }

  const now = performance.now();
  if (!startTime) {
    startTime = now;
  }

  if (e.key === "Backspace") {
    e.preventDefault();
    if (typedText.length > 0) {
      typedText = typedText.slice(0, -1);
    }
  } else if (e.key === "Enter") {
    // Treat Enter as a space so it still matches words
    e.preventDefault();
    typedText += " ";
  } else if (e.key.length === 1) {
    // Regular character (letters, numbers, punctuation, space)
    e.preventDefault();
    typedText += e.key;
  } else {
    // Ignore other keys (arrows, etc.)
    return;
  }

  const elapsed = (now - startTime) / 1000;
  const stats = calculateStats(typedText);

  // Global stats across all chunks
  const globalCorrect = totalCorrect + stats.correct;
  const globalIncorrect = totalIncorrect + stats.incorrect;
  const totalTypedGlobal = globalCorrect + globalIncorrect;
  const accuracy =
    totalTypedGlobal === 0 ? 100 : Math.max(0, Math.round((globalCorrect / totalTypedGlobal) * 100));
  const minutes = elapsed > 0 ? elapsed / 60 : 1 / 60;
  const wpm = Math.round((globalCorrect / 5) / minutes);

  updateStats(wpm, accuracy, globalCorrect, globalIncorrect);

  // When current 20-word chunk is fully typed, roll in the next 20 words.
  if (stats.totalTyped >= targetText.length) {
    totalCorrect += stats.correct;
    totalIncorrect += stats.incorrect;

    const difficulty = difficultySelect.value;
    targetText = generateChunk(difficulty, 20);
    totalExpectedChars += targetText.length;

    renderTargetText();
    typedText = "";
  }
});

// Initialize UI with default text
resetToIdle();
