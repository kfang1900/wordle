import { useState, useEffect } from 'react';
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
  gamesPlayed: number;
};

const socket = io('https://ws.wordle.kevinfaang.com', {
  transports: ['websocket'],
});

// for localhost
// const socket = io('http://localhost:3001', {
//   transports: ['websocket'],
// });

export default function Wordle() {
  const [winner, setWinner] = useState('');
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

  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null);

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
      setWinner(gameState.winner ?? '');
      setGamesPlayed(gameState.gamesPlayed);
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
      color: 'normal',
    });
  }

  function takeBackKey() {
    console.log('take back', displayRow, displayCol);
    if (displayCol === 0 || displayRow === ROWS) {
      return;
    }
    socket.emit('backspace');
  }

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
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
      socket.emit('submitWord');
      return;
    }

    socket.emit('submitWord');
  }
  return (
    <>
      <div className="games-played">{gamesPlayed} games played</div>
      {errorMessage && (
        <div
          className={`validation-message ${errorMessage.includes('🦙') ? 'winner-message' : ''}`}
        >
          {errorMessage}
        </div>
      )}
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
