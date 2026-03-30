/**
 * game.js — Frontend for Sudoku (Python Flask Edition)
 * ======================================================
 * All Sudoku logic (generation, solving, validation) lives in Python (app.py).
 * This file only handles UI, API calls, and game state.
 */

// ── State ─────────────────────────────────────────────────────────────────────
const MAX_M = 4;

let puzzle    = [];
let solution  = [];
let userBoard = [];
let sel       = null;
let diff      = "easy";
let timerInt  = null;
let elapsed   = 0;
let totalSolved = 0;
let bestSecs    = null;
let mistakes    = 0;
let gameOver    = false;

// ── API Calls (talk to Python backend) ───────────────────────────────────────

/**
 * Fetch a new puzzle from Python Flask.
 * GET /api/new-puzzle?difficulty=easy
 */
async function fetchNewPuzzle(difficulty) {
  const res  = await fetch(`/api/new-puzzle?difficulty=${difficulty}`);
  const data = await res.json();
  return data; // { puzzle, solution, clues, difficulty }
}

/**
 * Ask Python to solve a board.
 * POST /api/solve  { board: [[...]] }
 */
async function fetchSolve(board) {
  const res  = await fetch("/api/solve", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ board })
  });
  return await res.json(); // { solved: true, board: [[...]] }
}

/**
 * Ask Python to validate the current board.
 * POST /api/validate  { board: [[...]], solution: [[...]] }
 */
async function fetchValidate(board, solution) {
  const res  = await fetch("/api/validate", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ board, solution })
  });
  return await res.json(); // { errors: [{r, c}], count: N }
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderBoard() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = r;
      cell.dataset.c = c;
      if (puzzle[r][c]) {
        cell.textContent = puzzle[r][c];
        cell.classList.add("given");
      } else if (userBoard[r][c]) {
        cell.textContent = userBoard[r][c];
      }
      cell.addEventListener("click", () => selectCell(r, c));
      boardEl.appendChild(cell);
    }
  }
}

function G(r, c) {
  return document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
}

function setText(r, c, val, animate) {
  const el = G(r, c);
  if (!el) return;
  el.textContent = val || "";
  if (animate) {
    el.classList.remove("popin");
    void el.offsetWidth;
    el.classList.add("popin");
  }
}

// ── Selection & Highlighting ──────────────────────────────────────────────────

function selectCell(r, c) {
  clearHi();
  sel = { r, c };
  const v = puzzle[r][c] || userBoard[r][c];
  for (let i = 0; i < 9; i++) {
    G(r, i)?.classList.add("hi");
    G(i, c)?.classList.add("hi");
  }
  const sr = Math.floor(r / 3) * 3, sc = Math.floor(c / 3) * 3;
  for (let i = sr; i < sr + 3; i++)
    for (let j = sc; j < sc + 3; j++)
      G(i, j)?.classList.add("hi");
  if (v) {
    document.querySelectorAll(".cell").forEach(el => {
      const ev = puzzle[+el.dataset.r][+el.dataset.c] || userBoard[+el.dataset.r][+el.dataset.c];
      if (ev === v) el.classList.add("hi");
    });
  }
  G(r, c).classList.remove("hi");
  G(r, c).classList.add("selected");
}

function clearHi() {
  document.querySelectorAll(".cell").forEach(el => el.classList.remove("selected", "hi"));
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

document.getElementById("board").addEventListener("keydown", e => {
  if (!sel) return;
  const { r, c } = sel;
  if (e.key >= "1" && e.key <= "9") { placeNum(r, c, +e.key); e.preventDefault(); return; }
  if (["Backspace", "Delete", "0"].includes(e.key)) { placeNum(r, c, 0); e.preventDefault(); return; }
  const D = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
  if (D[e.key]) {
    const [dr, dc] = D[e.key];
    selectCell(Math.max(0, Math.min(8, r+dr)), Math.max(0, Math.min(8, c+dc)));
    e.preventDefault();
  }
});

// ── Place Number ──────────────────────────────────────────────────────────────

function typeNum(n) {
  if (!sel) { setStatus("Select a cell first", "err"); return; }
  placeNum(sel.r, sel.c, n);
}

function placeNum(r, c, n) {
  if (gameOver || puzzle[r][c]) return;
  userBoard[r][c] = n;
  const el = G(r, c);
  el.classList.remove("error", "correct");

  if (!n) { setText(r, c, 0, false); setStatus("", ""); return; }

  setText(r, c, n, true);

  if (n === solution[r][c]) {
    el.classList.add("correct");
    setStatus("✓ Correct! Keep going 🎉", "ok");
    setTimeout(() => {
      if (document.getElementById("status").textContent.startsWith("✓ Correct"))
        setStatus("", "");
    }, 1500);
  } else {
    el.classList.add("error");
    mistakes++;
    updateMistakesUI();
    const left = MAX_M - mistakes;
    if (mistakes >= MAX_M) onLose();
    else setStatus("✗ Wrong! " + left + " chance" + (left === 1 ? "" : "s") + " left", "err");
  }

  if (!gameOver && isComplete()) onWin();
}

function isComplete() {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const v = puzzle[r][c] || userBoard[r][c];
      if (!v || v !== solution[r][c]) return false;
    }
  return true;
}

// ── Mistakes UI ───────────────────────────────────────────────────────────────

function updateMistakesUI() {
  const safe = Math.max(0, MAX_M - mistakes);
  document.getElementById("hearts").textContent = "❤️".repeat(safe) + "🖤".repeat(Math.min(mistakes, MAX_M));
  document.getElementById("mcnt").textContent = Math.min(mistakes, MAX_M);
  document.getElementById("mbox").classList.toggle("danger", mistakes >= 3);
}

function resetMistakesUI() {
  mistakes = 0; gameOver = false;
  document.getElementById("hearts").textContent = "❤️❤️❤️❤️";
  document.getElementById("mcnt").textContent = "0";
  document.getElementById("mbox").classList.remove("danger");
}

// ── Win / Lose ────────────────────────────────────────────────────────────────

function onWin() {
  stopTimer(); totalSolved++;
  document.getElementById("st-solved").textContent = totalSolved;
  const t = fmt(elapsed);
  if (!bestSecs || elapsed < bestSecs) { bestSecs = elapsed; document.getElementById("st-best").textContent = t; }
  setStatus("✓ Solved in " + t + " — well done!", "ok");
}

function onLose() {
  gameOver = true; stopTimer();
  document.getElementById("overlay").classList.add("show");
  setStatus("✗ Game over — 4 mistakes!", "err");
}

// ── Timer & Status ────────────────────────────────────────────────────────────

function setStatus(msg, cls) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status " + (cls || "");
}

function startTimer() {
  stopTimer(); elapsed = 0;
  document.getElementById("timer").textContent = "00:00";
  timerInt = setInterval(() => { elapsed++; document.getElementById("timer").textContent = fmt(elapsed); }, 1000);
}
function stopTimer() { clearInterval(timerInt); }
function fmt(s) { return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); }

// ── Actions ───────────────────────────────────────────────────────────────────

function setDiff(btn) {
  document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  diff = btn.dataset.diff;
}

/**
 * New Game — calls Python API to get a fresh puzzle.
 */
async function newGame() {
  setStatus("Generating puzzle...", "info");
  try {
    const data = await fetchNewPuzzle(diff);
    puzzle    = data.puzzle;
    solution  = data.solution;
    userBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    sel       = null;
    resetMistakesUI();
    renderBoard();
    startTimer();
    setStatus(diff.charAt(0).toUpperCase() + diff.slice(1) + " · " + data.clues + " clues — good luck!", "info");
  } catch (err) {
    setStatus("Failed to load puzzle. Is Flask running?", "err");
  }
}

/**
 * Auto Solve — sends board to Python, animates the result.
 */
async function autoSolve() {
  if (!puzzle.flat().some(Boolean)) { setStatus("Generate a puzzle first!", "err"); return; }
  setStatus("Solving...", "info");
  try {
    const board = puzzle.map((row, r) => row.map((v, c) => v || userBoard[r][c]));
    const data  = await fetchSolve(board);
    if (data.solved) {
      stopTimer(); clearHi();
      let delay = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!puzzle[r][c]) {
            const val = data.board[r][c];
            userBoard[r][c] = val;
            const _r = r, _c = c;
            setTimeout(() => {
              G(_r, _c).classList.remove("error", "hi", "selected", "correct");
              setText(_r, _c, val, true);
            }, delay);
            delay += 16;
          }
        }
      }
      setTimeout(() => setStatus("✓ Puzzle solved by Python! 🐍", "ok"), delay + 50);
    } else {
      setStatus("✗ No solution exists.", "err");
    }
  } catch (err) {
    setStatus("Solver error. Is Flask running?", "err");
  }
}

/**
 * Validate — sends board + solution to Python for checking.
 */
async function validateBoard() {
  if (!puzzle.flat().some(Boolean)) { setStatus("Generate a puzzle first!", "err"); return; }
  try {
    document.querySelectorAll(".cell").forEach(el => el.classList.remove("error"));
    const data = await fetchValidate(userBoard, solution);
    data.errors.forEach(({ r, c }) => G(r, c)?.classList.add("error"));
    setStatus(data.count ? "✗ " + data.count + " error(s) found" : "✓ No errors found!", data.count ? "err" : "ok");
  } catch (err) {
    setStatus("Validation error. Is Flask running?", "err");
  }
}

/**
 * Reset — clear user entries, restart timer.
 */
function resetBoard() {
  if (!puzzle.flat().some(Boolean)) { setStatus("Generate a puzzle first!", "err"); return; }
  userBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
  sel = null;
  resetMistakesUI();
  renderBoard();
  startTimer();
  setStatus("Reset — try again!", "info");
}

// ── Init ──────────────────────────────────────────────────────────────────────
newGame();
