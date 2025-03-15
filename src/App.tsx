import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Display from './Display';
import Keyboard from './Keyboard';
import { ROWS, COLS } from './config';

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

const SOCKET_URL = 'wss://ws.wordle.kevinfaang.com/socket.io/';
const socket = io(SOCKET_URL);

export default function Wordle() {
  const [wordToday, setWordToday] = useState('');
  const [winner, setWinner] = useState('');
  const wordSet = new Set(wordToday);
  const [keyboardColors, setKeyboardColors] = useState<Record<string, string>>(
    Object.fromEntries(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => [letter, 'normal'])
    )
  );

  const [guesses, setGuesses] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(''))
  );

  const [guessColors, setGuessColors] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill('normal'))
  );

  const [displayRow, setDisplayRow] = useState<number>(0);
  const [displayCol, setDisplayCol] = useState<number>(0);

  useEffect(() => {
    socket.on('gameState', (gameState: GameState) => {
      setGuesses(gameState.board);
      setGuessColors(gameState.colors);
      setKeyboardColors(gameState.keyboardColors);
      setDisplayRow(gameState.row);
      setDisplayCol(gameState.col);
      setWordToday(gameState.targetWord);
      setWinner(winner ?? '');
    });
    return () => {
      socket.off('gameState');
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
      const timer = setTimeout(() => setErrorMessage(null), 2000);
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
      setErrorMessage('Not enough letters');
      return;
    }
    function calcColorForGuessLetter(letter: string, pos: number): string {
      if (letter === wordToday[pos]) {
        return 'correct';
      } else if (wordSet.has(letter)) {
        return 'misplaced';
      }
      return 'incorrect';
    }

    const newSubmitColors = guesses[displayRow].map((letter, index) =>
      calcColorForGuessLetter(letter, index)
    );

    socket.emit('submitWord', { user: 'Kevin', submitColors: newSubmitColors });
  }
  return (
    <>
      {errorMessage && <div>{errorMessage}</div>}
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
