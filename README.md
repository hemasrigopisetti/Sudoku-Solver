# 🎮 Sudoku Solver — Python Flask + Web Development

A full-stack Sudoku game where **Python handles all the logic** and the web frontend displays the game beautifully.

---

## 🧠 Tech Stack

| Layer      | Technology         | Role                                      |
|------------|--------------------|-------------------------------------------|
| Backend    | Python + Flask     | Puzzle generation, solver, validation API |
| Frontend   | HTML + CSS         | Game layout and styling                   |
| Frontend   | JavaScript (Fetch) | UI interactions, calls Python API         |
| Algorithm  | Backtracking       | Solves & generates Sudoku puzzles         |

---

## ✨ Features

- 🐍 **Python Backend** — all Sudoku logic written in pure Python
- 🧩 **Puzzle Generator** — randomised puzzles via backtracking algorithm
- 🎯 **3 Difficulty Levels** — Easy (46 clues), Medium (32), Hard (26)
- ✅ **Instant Feedback** — green for correct, red for wrong on every entry
- ❤️ **Mistake Limit** — only 4 wrong entries allowed before Game Over
- 💀 **Game Over Screen** — popup after 4 mistakes
- ⚡ **Auto Solver** — Python solves the board via API, animated on screen
- ✔️ **Validate** — Python checks your progress via API
- ⏱️ **Timer** — tracks time per puzzle
- 📊 **Session Stats** — puzzles solved + best time
- ⌨️ **Keyboard Support** — arrow keys, 1–9, Backspace

---

## 🗂️ Project Structure

```
sudoku-python/
├── app.py                  # Python Flask backend (API + routes)
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Main HTML page (served by Flask)
├── static/
│   ├── css/
│   │   └── style.css       # All styling
│   └── js/
│       └── game.js         # Frontend JS (calls Python API)
└── README.md
```

---

## 🚀 How to Run

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Flask server
```bash
python app.py
```

### 3. Open in browser
```
http://localhost:5000
```

---

## 🔌 Python API Endpoints

| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| GET    | `/api/new-puzzle`  | Generate a new puzzle + solution   |
| POST   | `/api/solve`       | Solve a given board using Python   |
| POST   | `/api/validate`    | Check user entries against solution|

### Example — Get a new puzzle
```bash
GET /api/new-puzzle?difficulty=medium
```
```json
{
  "puzzle":     [[5,3,0,...], ...],
  "solution":   [[5,3,4,...], ...],
  "clues":      32,
  "difficulty": "medium"
}
```

### Example — Solve a board
```bash
POST /api/solve
{ "board": [[5,3,0,...], ...] }
```
```json
{
  "solved": true,
  "board":  [[5,3,4,...], ...]
}
```

---

## 🧠 How the Algorithm Works

### Puzzle Generation (Python)
1. Start with an empty 9×9 board
2. Fill it with a valid complete solution using **randomised backtracking**
3. Remove cells until the target clue count is reached

### Solver (Python)
- Classic **backtracking**: tries numbers 1–9 in each empty cell
- If a number causes a conflict → backtrack and try the next one
- Guaranteed to find a solution if one exists

### Mistake System (Frontend)
- Every entry is instantly checked against the solution
- 4 wrong entries → Game Over 💀

---

## 🛠️ Built With

- **Python 3** + **Flask**
- Vanilla JavaScript (ES6) with Fetch API
- CSS Grid + Custom Properties
- Google Fonts — DM Serif Display + DM Mono

---
<div align="center">

Made with ❤️ by **Hemasri Gopisetti** &copy; 2025

*"Every great developer started with a simple game."*

⭐ **Star this repo if you liked it!** ⭐

</div>
