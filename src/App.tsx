import { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import Display from './Display';
import Keyboard from './Keyboard';
import { ROWS, COLS, ALPHABET } from './config';

type GameState = {
  board: string[][];
  users: (string | null)[][];
  colors: string[][];
  keyboardColors: Record<string, string>;
  history: {
    user: string;
    letter?: string;
    row?: number;
    col?: number;
    action?: string;
  }[];
  row: number;
  col: number;
  winner: string | null;
  targetWord: string;
};

// const socket = io('https://ws.wordle.kevinfaang.com', {
//   transports: ['websocket'],
// });

// for localhost
const socket = io('http://localhost:3001', {
  transports: ['websocket'],
});

export default function Wordle() {
  const [wordToday, setWordToday] = useState('');
  const [winner, setWinner] = useState('');
  const wordSet = new Set(wordToday);
  const [keyboardColors, setKeyboardColors] = useState<Record<string, string>>(
    Object.fromEntries(ALPHABET.split('').map((letter) => [letter, 'normal']))
  );

  const [guesses, setGuesses] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(''))
  );

  const [guessColors, setGuessColors] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill('normal'))
  );

  const [displayRow, setDisplayRow] = useState<number>(0);
  const [displayCol, setDisplayCol] = useState<number>(0);

  const wordTodayDict: Record<string, number> = useMemo(() => {
    const dict = Object.fromEntries(
      ALPHABET.split('').map((letter) => [letter, 0])
    );
    for (const letter of wordToday) {
      dict[letter] += 1;
    }
    return dict;
  }, [wordToday]);

  useEffect(() => {
    // Setup socket connection and event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socket.on('gameState', (gameState: GameState) => {
      setGuesses(gameState.board);
      setGuessColors(gameState.colors);
      setKeyboardColors(gameState.keyboardColors);
      setDisplayRow(gameState.row);
      setDisplayCol(gameState.col);
      setWordToday(gameState.targetWord);
      setWinner(gameState.winner ?? '');
    });

    socket.on('validation', (message: string) => {
      setErrorMessage(message);
    });

    // Clean up event listeners
    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('gameState');
      socket.off('validation');
    };
  }, []);

  function handleLetterClick(clickedLetter: string) {
    if (displayCol === COLS || displayRow === ROWS || winner) {
      return;
    }

    const newGuessColors = guessColors.map((row, rowIndex) =>
      rowIndex === displayRow
        ? row.map((color, colIndex) =>
            colIndex === displayCol ? 'normal' : color
          )
        : row
    );
    console.log(newGuessColors);
    setGuessColors(newGuessColors);

    socket.emit('addLetter', {
      letter: clickedLetter,
      user: 'Kevin',
      color: 'normal',
    });
  }

  function takeBackKey() {
    console.log('take back', displayRow, displayCol);
    if (displayCol === 0 || displayRow === ROWS) {
      return;
    }
    socket.emit('backspace', {
      user: 'Kevin',
    });
  }

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 1400);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  function finalizeGuess() {
    if (displayRow === ROWS || winner) {
      return;
    }
    const guess = guesses[displayRow].filter(
      (letter): letter is string => letter !== ''
    );
    if (guess.length < COLS) {
      socket.emit('submitWord', { user: 'Kevin', submitColors: [] });
      return;
    }

    const newSubmitColors: string[] = Array(COLS).fill('');
    const guessDict: Record<string, number> = Object.fromEntries(
      ALPHABET.split('').map((letter) => [letter, 0])
    );
    for (const [pos, letter] of [...guess].entries()) {
      if (letter === wordToday[pos]) {
        guessDict[letter] += 1;
        newSubmitColors[pos] = 'correct';
      }
    }
    for (const [pos, letter] of [...guess].entries()) {
      if (newSubmitColors[pos] === 'correct') {
        continue;
      }
      guessDict[letter] += 1;
      if (wordSet.has(letter) && guessDict[letter] <= wordTodayDict[letter]) {
        newSubmitColors[pos] = 'misplaced';
      } else {
        newSubmitColors[pos] = 'incorrect';
      }
    }

    socket.emit('submitWord', { user: 'Kevin', submitColors: newSubmitColors });
  }
  return (
    <>
      {errorMessage && <div className="validation-message">{errorMessage}</div>}
      <Display displays={guesses} guessColors={guessColors} />
      <Keyboard
        onLetterClick={handleLetterClick}
        finalizeGuess={finalizeGuess}
        takeBack={takeBackKey}
        keyboardColors={keyboardColors}
      />
    </>
  );
}
