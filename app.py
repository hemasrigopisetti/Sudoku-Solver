"""
app.py — Sudoku Solver & Generator (Flask Backend)
====================================================
Run:  pip install flask
      python app.py
Open: http://localhost:5000
"""

from flask import Flask, jsonify, request, render_template
import random

app = Flask(__name__)

# ── Sudoku Engine ─────────────────────────────────────────────────────────────

def is_valid(board, row, col, num):
    """Check if placing num at (row, col) is valid."""
    # Check row
    if num in board[row]:
        return False
    # Check column
    if num in [board[r][col] for r in range(9)]:
        return False
    # Check 3x3 box
    sr, sc = (row // 3) * 3, (col // 3) * 3
    for r in range(sr, sr + 3):
        for c in range(sc, sc + 3):
            if board[r][c] == num:
                return False
    return True


def solve(board):
    """Backtracking solver. Returns True if solved, False if unsolvable."""
    for r in range(9):
        for c in range(9):
            if board[r][c] == 0:
                for num in range(1, 10):
                    if is_valid(board, r, c, num):
                        board[r][c] = num
                        if solve(board):
                            return True
                        board[r][c] = 0
                return False
    return True


def fill_board(board):
    """Fill an empty board with a valid randomised complete solution."""
    for r in range(9):
        for c in range(9):
            if board[r][c] == 0:
                nums = list(range(1, 10))
                random.shuffle(nums)
                for num in nums:
                    if is_valid(board, r, c, num):
                        board[r][c] = num
                        if fill_board(board):
                            return True
                        board[r][c] = 0
                return False
    return True


CLUES = {"easy": 46, "medium": 32, "hard": 26}

def generate_puzzle(difficulty="easy"):
    """Generate a puzzle + solution for the given difficulty."""
    full = [[0] * 9 for _ in range(9)]
    fill_board(full)

    solution = [row[:] for row in full]
    puzzle   = [row[:] for row in full]

    cells     = list(range(81))
    random.shuffle(cells)
    to_remove = 81 - CLUES[difficulty]

    for i in range(to_remove):
        puzzle[cells[i] // 9][cells[i] % 9] = 0

    return puzzle, solution


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main game page."""
    return render_template("index.html")


@app.route("/api/new-puzzle")
def new_puzzle():
    """
    GET /api/new-puzzle?difficulty=easy
    Returns a new puzzle and its solution.
    """
    difficulty = request.args.get("difficulty", "easy")
    if difficulty not in CLUES:
        return jsonify({"error": "Invalid difficulty"}), 400

    puzzle, solution = generate_puzzle(difficulty)
    clues = sum(1 for row in puzzle for v in row if v != 0)

    return jsonify({
        "puzzle":     puzzle,
        "solution":   solution,
        "clues":      clues,
        "difficulty": difficulty
    })


@app.route("/api/solve", methods=["POST"])
def solve_puzzle():
    """
    POST /api/solve
    Body: { "board": [[...], ...] }
    Returns the solved board or an error.
    """
    data  = request.get_json()
    board = data.get("board")

    if not board or len(board) != 9:
        return jsonify({"error": "Invalid board"}), 400

    # Deep copy so we don't mutate the original
    board_copy = [row[:] for row in board]

    if solve(board_copy):
        return jsonify({"solved": True, "board": board_copy})
    else:
        return jsonify({"solved": False, "error": "No solution exists"})


@app.route("/api/validate", methods=["POST"])
def validate_puzzle():
    """
    POST /api/validate
    Body: { "board": [[...]], "solution": [[...]] }
    Returns list of incorrect cells.
    """
    data     = request.get_json()
    board    = data.get("board")
    solution = data.get("solution")

    errors = []
    for r in range(9):
        for c in range(9):
            if board[r][c] != 0 and board[r][c] != solution[r][c]:
                errors.append({"r": r, "c": c})

    return jsonify({"errors": errors, "count": len(errors)})


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🎮 Sudoku Server running at http://localhost:5000")
    app.run(debug=True)
