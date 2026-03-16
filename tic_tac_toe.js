const readlineSync = require("readline-sync");
const SQUARE_MARKERS = Object.freeze({
  player: 'X',
  computer: '@'
});
const OUTCOMES = Object.freeze({
  player: SQUARE_MARKERS['player'],
  computer: SQUARE_MARKERS['computer'],
  tie: 'Tie'
});
const WIN_MATCH_SCORE = 5;
const SQUARES_STATE_DEFAULT = Object.freeze({ // squares marked with a number string are unclaimed by either the player or the computer
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9'
});
const WINNING_SCENARIOS = Object.freeze([ // combinations of squares marked by a single contestant that constitute a win
  Object.freeze(['1', '2', '3']),
  Object.freeze(['4', '5', '6']),
  Object.freeze(['7', '8', '9']),
  Object.freeze(['1', '4', '7']),
  Object.freeze(['2', '5', '8']),
  Object.freeze(['3', '6', '9']),
  Object.freeze(['1', '5', '9']),
  Object.freeze(['3', '5', '7'])
]);
const empty5 = '     ';
const empty2 = '  ';
const vert = '|';
const hor5 = '-----';
const connector = '+';
const emptyRow = [empty5, vert, empty5, vert, empty5].join('');
const dividerRow = [hor5, connector, hor5, connector, hor5].join('');
const VALID_AFFIRMATIVES = Object.freeze(['yes', 'y']);
const VALID_NEGATIVES = Object.freeze(['no', 'n']);
const GAME_MODES = Object.freeze({singles: 'singles', match: 'match'});
const PRIORITY_MOVE = '5';
const FIRST_MOVER_VALUES = Object.freeze({choose: 'choose', computer: 'computer', player: 'player'});
const FIRST_MOVER = FIRST_MOVER_VALUES['choose']; // select 'choose', 'player', or 'computer'

function prompt(text) {
  console.log(`>>> ${text}`);
}

function quote(inputString) {
  return `'${inputString}'`;
}

function joinOr(inputArray, mainDelimiter = ',', finalDelimiter = 'or') {
  let length = inputArray.length;
  if (length === 0) return '';
  if (length === 1) return String(inputArray[0]);

  mainDelimiter = mainDelimiter.trim();
  mainDelimiter = mainDelimiter.padEnd(mainDelimiter.length + 1);
  finalDelimiter = finalDelimiter.trim();
  finalDelimiter = finalDelimiter.padStart(finalDelimiter.length + 1);
  finalDelimiter = finalDelimiter.padEnd(finalDelimiter.length + 1);

  let lastCharIndex = length - 1;
  return inputArray.slice(0, lastCharIndex).join(mainDelimiter) +
  finalDelimiter + inputArray.slice(lastCharIndex);
}

function getYesNo() {
  while (true) {
    let userInput = readlineSync
      .question(`Please enter ${quote(VALID_AFFIRMATIVES[0])} or ${quote(VALID_NEGATIVES[0])}: `)
      .toLowerCase();

    if (VALID_NEGATIVES.includes(userInput)) {
      return VALID_NEGATIVES[0];
    } else if (VALID_AFFIRMATIVES.includes(userInput)) {
      return VALID_AFFIRMATIVES[0];
    } else {
      prompt(`Your input is not valid. Valid input includes ${joinOr(VALID_AFFIRMATIVES.concat(VALID_NEGATIVES).map(input => quote(input)), ',', 'and')}.`);
    }
  }
}

function askToProceed() {
    readlineSync.question(`Please hit 'enter' to proceed.`);
    console.clear();
}

function initializeGame() {
  let initializedSquares = {};

  for (let square in SQUARES_STATE_DEFAULT) {
    initializedSquares[square] = SQUARES_STATE_DEFAULT[square];
  }

  return initializedSquares;
}

function displayBoard(currentSquaresState) {
  let row2 = [empty2, currentSquaresState['1'], empty2, vert, empty2, currentSquaresState['2'], empty2, vert, empty2, currentSquaresState['3'], empty2].join('');
  let row6 = [empty2, currentSquaresState['4'], empty2, vert, empty2, currentSquaresState['5'], empty2, vert, empty2, currentSquaresState['6'], empty2].join('');
  let row10 = [empty2, currentSquaresState['7'], empty2, vert, empty2, currentSquaresState['8'], empty2, vert, empty2, currentSquaresState['9'], empty2].join('');

  console.clear();
  console.log(`\n${emptyRow}\n${row2}\n${emptyRow}\n${dividerRow}\n${emptyRow}\n${row6}\n${emptyRow}\n${dividerRow}\n${emptyRow}\n${row10}\n${emptyRow}\n`);
}

function availableSquares(currentSquaresState) {
  let available = [];

  for (let square in currentSquaresState) {
    if (!Object.values(SQUARE_MARKERS).includes(currentSquaresState[square])) {
      available.push(square);
    }
  }

  return available;
}

function isAvailableSquare(inputSquare, currentSquaresState) {
  let available = availableSquares(currentSquaresState);
  return available.includes(inputSquare);
}

function isValidInputSquare(input) {
  return Object.keys(SQUARES_STATE_DEFAULT).includes(input);
}

function playerChooses(currentSquaresState) {
  let chosenSquare;

  do {
    prompt(`It's your turn. Please choose from available squares ${joinOr(availableSquares(currentSquaresState))}.`);
    chosenSquare = readlineSync.question('Enter your choice here: ');

    if (!isValidInputSquare(chosenSquare)) {
      prompt(`Your input is not valid. Valid inputs include the following values: ${joinOr(Object.keys(SQUARES_STATE_DEFAULT))}.`);
    } else if (!isAvailableSquare(chosenSquare, currentSquaresState)) {
      prompt('The square you picked has already been taken.');
    }
  } while (!isAvailableSquare(chosenSquare, currentSquaresState) ||
  !isValidInputSquare(chosenSquare));

  return chosenSquare;
}

function countContestantSquares(squaresArray, contestant) {
  let counter = 0;
  squaresArray.forEach(square => {
    if (square === SQUARE_MARKERS[contestant]) {
      counter += 1;
    }
  });
  return counter;
}

function getScenarioState(inputScenario, currentSquaresState) {
  let requiredSquare1 = inputScenario[0];
  let requiredSquare2 = inputScenario[1];
  let requiredSquare3 = inputScenario[2];

  return [
    currentSquaresState[requiredSquare1],
    currentSquaresState[requiredSquare2],
    currentSquaresState[requiredSquare3]
  ];
}

function selectBlockingMove(adjacentSquares) {
  for (let square of adjacentSquares) {
    if (square !== SQUARE_MARKERS['player']) return square;
  }
  return '';
}

function shouldComputerBlock(currentSquaresState) {
  for (let scenario of WINNING_SCENARIOS) {
    let requiredSquares = getScenarioState(scenario, currentSquaresState);

    if (requiredSquares.includes(SQUARE_MARKERS['computer'])) continue; // if the computer has already claimed one of the squares in the winning scenario under evaluation, the player can never win using this scenario and the scenario is not a threat to the computer.
    if (countContestantSquares(requiredSquares, 'player') === 2) return selectBlockingMove(requiredSquares);
  }

  return '';
}

function selectWinningMove(adjacentSquares) {
  for (let square of adjacentSquares) {
    if (square !== SQUARE_MARKERS['computer']) return square;
  }

  return '';
}

function canComputerWin(currentSquaresState) {
  for (let scenario of WINNING_SCENARIOS) {
    let requiredSquares = getScenarioState(scenario, currentSquaresState);

    if (requiredSquares.includes(SQUARE_MARKERS['player'])) continue;
    if (countContestantSquares(requiredSquares, 'computer') === 2) return selectWinningMove(requiredSquares);
  }

  return '';
}

function computerChooses(currentSquaresState) {
  let canWin = canComputerWin(currentSquaresState);
  if (canWin) return canWin;

  let shouldBlock = shouldComputerBlock(currentSquaresState);
  if (shouldBlock) return shouldBlock;

  let optionsArray = availableSquares(currentSquaresState);
  if (optionsArray.includes(PRIORITY_MOVE)) return PRIORITY_MOVE;

  let optionIndex = Math.floor(Math.random() * optionsArray.length);
  return optionsArray[optionIndex];
}

function markSquare(choiceFunction, currentSquaresState) {
  let squareChoice = choiceFunction(currentSquaresState);

  if (choiceFunction === playerChooses) {
    currentSquaresState[squareChoice] = SQUARE_MARKERS['player'];
    displayBoard(currentSquaresState);
  } else if (choiceFunction === computerChooses) {
    currentSquaresState[squareChoice] = SQUARE_MARKERS['computer'];
    displayBoard(currentSquaresState);
    prompt(`It's your opponent's turn.`)
    prompt(`Your opponent has chosen: ${squareChoice}.`);
    
  }
}

function executeTurn(currentSquaresState, computerPriority) {
  let completedPlayerTurns = Object.values(currentSquaresState)
    .filter(square => square === SQUARE_MARKERS['player'])
    .length;

  let completedComputerTurns = Object.values(currentSquaresState)
    .filter(square => square === SQUARE_MARKERS['computer'])
    .length;

  let computerFirst = computerPriority ?
    (completedPlayerTurns >= completedComputerTurns) :
    (completedPlayerTurns > completedComputerTurns); // if one contestant has completed fewer turns, they always get a turn. If both constants have completed an equal number of turns, the truthiness of computerPriority determines which one goes first.

  if (computerFirst) {
    markSquare(computerChooses, currentSquaresState);
    askToProceed();
  } else {
    displayBoard(currentSquaresState);
    markSquare(playerChooses, currentSquaresState);
  }
}

function isBoardFull(currentSquaresState) {
  return availableSquares(currentSquaresState).length === 0;
}

function determineGame(currentSquaresState) {
  for (let scenario of WINNING_SCENARIOS) {
    let requiredSquare1 = scenario[0];
    let requiredSquare2 = scenario[1];
    let requiredSquare3 = scenario[2];
    let markSquare1 = currentSquaresState[requiredSquare1];
    let markSquare2 = currentSquaresState[requiredSquare2];
    let markSquare3 = currentSquaresState[requiredSquare3];

    if (markSquare1 === markSquare2 && markSquare2 === markSquare3) { // winning condition: if all three squares specified in the scenario criteria are claimed by the same player
      return markSquare1; // return the marker of the player who has claimed the winning squares
    }
  }

  if (isBoardFull(currentSquaresState)) {
    return OUTCOMES['tie'];
  }

  return '';
}

function displayOutcome(outcome) {
  switch (outcome) {
    case OUTCOMES['tie']:
      prompt("It's a tie!");
      break;
    case OUTCOMES['player']:
      prompt('Congratulations, you win!');
      break;
    case OUTCOMES['computer']:
      prompt('Your opponent has won.');
      break;
    default:
      prompt('Outcome unclear.');
  }
}

function hasComputerPriority() {
  switch (FIRST_MOVER) {
    case FIRST_MOVER_VALUES['computer']:
      return true;
    case FIRST_MOVER_VALUES['player']:
      return false;
    case FIRST_MOVER_VALUES['choose']: {
      prompt('Would you like to go first?');

      let playerPriority = (getYesNo() === VALID_AFFIRMATIVES[0]);
      let computerPriority = !playerPriority;

      return computerPriority;
    }
    default:
      return false;
  }
}

function runGame() {
  const gameState = initializeGame();
  let outcome;
  console.clear();
  prompt(`Welcome to this game! You will be playing as ${SQUARE_MARKERS['player']} and your opponent will be playing as ${SQUARE_MARKERS['computer']}.`);

  let computerPriority = hasComputerPriority();

  do {
    executeTurn(gameState, computerPriority);
    outcome = determineGame(gameState);
  }
  while (!outcome);

  displayBoard(gameState);
  displayOutcome(outcome);

  return outcome;
}

function isValidMode(inputMode) {
  return Object.values(GAME_MODES).includes(inputMode.toLowerCase());
}

function matchOrSingle() {
  prompt('Would you like to play single games or a match?');
  prompt(`A match will end when a player has won ${WIN_MATCH_SCORE} games.`);
  let selectedMode;

  do {
    selectedMode = readlineSync
      .question(`Please enter ${joinOr(Object.values(GAME_MODES).map(mode => quote(mode)))} here: `)
      .toLowerCase();
    if (!isValidMode(selectedMode)) {
      prompt(`Your input is not valid. Valid inputs include ${joinOr(Object.values(GAME_MODES).map(mode => quote(mode)), ',', 'and')}.`);
    }
  }
  while (!isValidMode(selectedMode));

  return selectedMode;
}

function displayScores(scores) {
  prompt(`Your score: ${scores['player']}.`);
  prompt(`Opponent's score: ${scores['computer']}.`);
}

function updateScores(gameOutcome, scoresObj) {
  switch (gameOutcome)  {
    case OUTCOMES['player']:
      scoresObj['player'] += 1;
      break;
    case OUTCOMES['computer']:
      scoresObj['computer'] += 1;
      break;
  }
}

function determineMatch(scoresObj) {
  let outcome = '';

  if (scoresObj['player'] === WIN_MATCH_SCORE) {
    outcome = OUTCOMES['player'];
  } else if (scoresObj['computer'] === WIN_MATCH_SCORE) {
    outcome = OUTCOMES['computer'];
  }

  return outcome;
}

function runMatch() {
  prompt('Starting a match...');
  let scores = {player: 0, computer: 0};
  let matchOutcome = '';

  while (!matchOutcome) {
    displayScores(scores);
    prompt(`Starting a new game...`);
    askToProceed()

    let gameOutcome = runGame();
    updateScores(gameOutcome, scores);

    matchOutcome = determineMatch(scores);
  }

  askToProceed();
  prompt('The match is over!');
  displayScores(scores);
  displayOutcome(matchOutcome);
  return matchOutcome;
}

function playTicTacToe() {
  console.clear();
  prompt("Welcome to TicTacToe!");
  let chosenMode = matchOrSingle();
  console.clear();

  if (chosenMode === GAME_MODES['match']) {
    runMatch();
    askToProceed();
  } else {
    let playGame = VALID_AFFIRMATIVES[0];

    while (VALID_AFFIRMATIVES.includes(playGame)) {
      runGame();
      prompt("Would you like to start a new game?");
      playGame = getYesNo();
    }
  }

  console.clear();
  prompt(`Thank you for playing! Goodbye!`);
}

playTicTacToe();
