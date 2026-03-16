# Tic Tac Toe

---

## Table of Contents

- [Purpose of the application](#purpose-of-the-application)
- [Quickstart](#quickstart)
- [Technical Description](#technical-description)
  - [Requirements](#requirements)
  - [Dependencies](#dependencies)
  - [Architecture](#architecture)
  - [Supporting constants](#supporting-constants)
    - [SQUARE_MARKERS](#square_markers)
    - [OUTCOMES](#outcomes)
    - [WINNING_SCENARIOS](#winning_scenarios)
    - [GAME_MODES](#game_modes)
    - [FIRST_MOVER](#first_mover)
  - [Supporting functions](#supporting-functions)
    - [prompt(text)](#prompttext)
    - [joinOr(inputArray, mainDelimiter, finalDelimiter)](#joinorinputarray-maindelimiter-finaldelimiter)
    - [getYesNo()](#getyesno)
    - [askToProceed()](#asktoproceed)
  - [Board functions](#board-functions)
    - [initializeGame()](#initializegame)
    - [displayBoard(currentSquaresState)](#displayboardcurrentsquaresstate)
    - [availableSquares(currentSquaresState)](#availablesquarescurrentsquaresstate)
  - [Player turn](#player-turn)
    - [playerChooses(currentSquaresState)](#playerchoosescurrentsquaresstate)
  - [Computer turn](#computer-turn)
    - [computerChooses(currentSquaresState)](#computerchoosescurrentsquaresstate)
    - [canComputerWin(currentSquaresState)](#cancomputerwincurrentsquaresstate)
    - [shouldComputerBlock(currentSquaresState)](#shouldcomputerblockcurrentsquaresstate)
  - [Turn and game execution](#turn-and-game-execution)
    - [markSquare(choiceFunction, currentSquaresState)](#marksquarechoicefunction-currentsquaresstate)
    - [executeTurn(currentSquaresState, computerPriority)](#executeturncurrentsquaresstate-computerpriority)
    - [determineGame(currentSquaresState)](#determinegamecurrentsquaresstate)
    - [runGame()](#rungame)
  - [Match mode](#match-mode)
    - [runMatch()](#runmatch)
  - [playTicTacToe()](#playtictactoe)

---

## Purpose of the application

This application is a terminal-based implementation of Tic Tac Toe. The player competes against a computer opponent on a 3×3 grid, taking turns to claim squares. The first to claim three squares in a row — horizontally, vertically, or diagonally — wins the game. The application supports two modes: **singles** (individual games) and **match** (first contestant to win 5 games wins the match).

---

## Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/t-stm/Tic-Tac-Toe
cd Tic-Tac-Toe

# 2. Install dependencies
npm install

# 3. Start the application
node tic_tac_toe.js
```

---

## Technical Description

### Requirements

| Tool | Version |
|---|---|
| Node.js | v22.17.0 |

### Dependencies

| Package | Version |
|---|---|
| readline-sync | 1.4.10 |

Install all dependencies with:

```bash
npm install
```

### Architecture

The application is organised into two layers: a set of **supporting constants and utility functions** that handle configuration and terminal I/O, and a set of **game functions** that model the board state, player and computer logic, and game/match flow.

| Layer | File | Role |
|---|---|---|
| Supporting | `tic_tac_toe.js` (constants, `prompt`, `joinOr`, `getYesNo`, `askToProceed`) | Configuration, text output, user input handling |
| Game logic | `tic_tac_toe.js` (board, player, computer, turn, game, match functions) | Board state, move logic, win detection, game and match flow |

All code lives in a single file, `tic_tac_toe.js`. The entry point is `playTicTacToe()`, called at the bottom of the file.

---

## Supporting constants

### SQUARE_MARKERS

A frozen object that defines the marker assigned to each contestant. The player is marked with `X` and the computer with `@`. These values are used throughout to claim squares and check for wins.

### OUTCOMES

A frozen object that maps each possible game result, either a `tie` or a `player` or `computer` win, to its outcome value. `player` and `computer` outcomes use the corresponding `SQUARE_MARKERS` value, so that `determineGame` can return a marker and have it matched directly against `OUTCOMES`.

### WINNING_SCENARIOS

A frozen array of eight frozen arrays, each representing a combination of three squares that constitute a win (three rows, three columns, and two diagonals) if claimed by the same contestant. Used by `determineGame`, `canComputerWin`, and `shouldComputerBlock` to evaluate board state.

### GAME_MODES

A frozen object with two values: `singles` and `match`. Used by `matchOrSingle` to validate user input and by `playTicTacToe` to branch into the correct game loop.

### FIRST_MOVER

A single configurable constant that determines who moves first. It can be set to `'player'`, `'computer'`, or `'choose'` (default), which prompts the user to choose the first-mover at the start of each game. To hardcode the first mover, change this value directly in the source file.

---

## Supporting functions

### prompt(text)

Prints a `>>>` -prefixed message to the console. Used throughout to present information and prompts to the user in a consistent format.

### joinOr(inputArray, mainDelimiter, finalDelimiter)

Joins an array of strings into a readable list, using a main delimiter between all but the last element and a different final delimiter before the last (output may look like: `1, 2 or 3`). Defaults to `,` and `or`. Used throughout to construct human-readable option lists in prompts.

### getYesNo()

Prompts the user to enter `yes`/`y` or `no`/`n` and loops until a valid response is received. Returns the canonical form (`yes` or `no`). Accepts both the full word and the single-letter shorthand.

### askToProceed()

Prompts the user to press Enter and then clears the terminal. Used as a pause between turns and game states to prevent information overload.

---

## Board functions

### initializeGame()

Creates and returns a fresh squares state object by copying `SQUARES_STATE_DEFAULT`. Each of the nine squares is keyed by its number string (`'1'`–`'9'`) and initialised to that number string, indicating it is unclaimed.

### displayBoard(currentSquaresState)

Clears the terminal and prints the current board state as a formatted 3×3 grid. Each square displays either its number (if unclaimed) or the marker of the contestant who claimed it.

### availableSquares(currentSquaresState)

Returns an array of square numbers that have not yet been claimed by either contestant — i.e. squares whose value is not in `SQUARE_MARKERS`. Used by `playerChooses`, `computerChooses`, and `isBoardFull`.

---

## Player turn

### playerChooses(currentSquaresState)

Prompts the user to select an available square and loops until a valid, unclaimed square is entered. Validates input in two steps: first checking that the input is a valid square number, then checking that the square is still available. Returns the chosen square number.

---

## Computer turn

### computerChooses(currentSquaresState)

Implements the computer's move selection using a four-level priority system:

1. **Win** — if the computer can complete a winning scenario this turn, it does so (`canComputerWin`).
2. **Block** — if the player is one square away from winning, the computer blocks it (`shouldComputerBlock`).
3. **Centre** — if square `5` is available, the computer takes it (`PRIORITY_MOVE`).
4. **Random** — otherwise, the computer picks a random available square.

### canComputerWin(currentSquaresState)

Iterates over `WINNING_SCENARIOS` to find any scenario where the computer has claimed two of the three required squares and the third is still available. Returns the number of the winning square if found, or an empty string otherwise.

### shouldComputerBlock(currentSquaresState)

Iterates over `WINNING_SCENARIOS` to find any scenario where the player has claimed two of the three required squares, none of which have been claimed by the computer, and the third is still available. Returns the number of the blocking square if found, or an empty string otherwise.

---

## Turn and game execution

### markSquare(choiceFunction, currentSquaresState)

Calls the provided choice function (`playerChooses` or `computerChooses`) to obtain a square, then updates `currentSquaresState` with the appropriate marker. Refreshes the board display after each move and, for the computer's move, prints a message announcing the chosen square.

### executeTurn(currentSquaresState, computerPriority)

Determines whose turn it is by comparing the number of completed turns for each contestant. If `computerPriority` is `true` and both contestants have completed an equal number of turns, the computer goes first; otherwise the player goes first. Calls `markSquare` for the appropriate contestant and pauses with `askToProceed` after the computer's move.

### determineGame(currentSquaresState)

Checks all eight `WINNING_SCENARIOS` to see if any contestant has claimed all three required squares. Returns the winner's marker if a winning scenario has been completed, `OUTCOMES['tie']` if the board is full, or an empty string if the game is still in progress.

### runGame()

Orchestrates a single game of Tic Tac Toe. It initialises the board, determines who moves first via `hasComputerPriority`, then loops — executing turns and checking for an outcome — until the game ends. Displays the final board and outcome before returning the result.

---

## Match mode

### runMatch()

Runs a match to until a contestant has won `WIN_MATCH_SCORE` (5) games. It initialises a `scores` object and loops through individual games via `runGame`, updating scores with `updateScores` after each game and checking for a match winner with `determineMatch`. Displays running scores between games and announces the match result at the end.

---

## playTicTacToe()

The entry point of the application. It welcomes the user, calls `matchOrSingle` to determine the game mode, and then either runs a match (`runMatch`) or loops through individual games (`runGame`) until the user declines to play again.
