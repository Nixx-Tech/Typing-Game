const textDisplayEl = document.getElementById("text-display");
const textInputEl = document.getElementById("text-input");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const difficultySelect = document.getElementById("difficulty-select");
const countdownEl = document.getElementById("countdown");
const wpmEl = document.getElementById("wpm");
const bestWpmEl = document.getElementById("best-wpm");
const accuracyEl = document.getElementById("accuracy");
const charsEl = document.getElementById("chars");

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
let startTime = null;
let testRunning = false;
let highScoreWpm = Number(localStorage.getItem("typingHighScoreWpm") || "0");

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
  // Generate a very long stream of text so you effectively never run out.
  const difficultyMultiplier =
    difficulty === "easy" ? 1.0 : difficulty === "hard" ? 1.5 : 1.2;
  const estimatedChars = Math.round(6000 * difficultyMultiplier);
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
  if (wpm > highScoreWpm) {
    highScoreWpm = wpm;
    localStorage.setItem("typingHighScoreWpm", String(highScoreWpm));
  }
  bestWpmEl.textContent = String(highScoreWpm);
  accuracyEl.textContent = `${accuracy}%`;
  charsEl.textContent = `${correct + incorrect} / ${targetText.length}`;
}

function startTest() {
  if (testRunning) return;

  countdownEl.textContent = "Endless mode · type as long as you like.";
  prepareText();

  testRunning = true;
  startBtn.disabled = true;
  restartBtn.disabled = false;
  difficultySelect.disabled = true;

  textInputEl.disabled = false;
  textInputEl.value = "";
  textInputEl.focus();

  startTime = performance.now();
}

function resetToIdle() {
  testRunning = false;
  textInputEl.value = "";
  textInputEl.disabled = true;

  startBtn.disabled = false;
  restartBtn.disabled = true;
  difficultySelect.disabled = false;
  countdownEl.textContent = "Endless mode · click Start to begin.";

  prepareText();
}

function restartTest() {
  // Reset everything and start a fresh endless session.
  testRunning = false;
  startBtn.disabled = false;
  startTest();
}

startBtn.addEventListener("click", startTest);
restartBtn.addEventListener("click", restartTest);

textInputEl.addEventListener("input", () => {
  if (!testRunning) return;
  const now = performance.now();
  const elapsed = (now - startTime) / 1000;
  const typedText = textInputEl.value;
  const stats = calculateStats(typedText, Math.max(elapsed, 0.1));
  updateStats(stats.wpm, stats.accuracy, stats.correct, stats.incorrect);

  // If we are getting close to the end of the current text, append more.
  const remainingChars = targetText.length - typedText.length;
  if (remainingChars < 200) {
    const difficulty = difficultySelect.value;
    const extra = sampleWords(difficulty, 2000);
    const startIndex = targetText.length;
    targetText += " " + extra;

    for (let i = startIndex; i < targetText.length; i++) {
      const span = document.createElement("span");
      span.textContent = targetText[i];
      span.classList.add("char");
      textDisplayEl.appendChild(span);
    }
  }
});

// Initialize UI with default text
resetToIdle();


