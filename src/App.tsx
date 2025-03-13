import { useState, useEffect } from 'react';

const WORD_TODAY = 'PICKLE';
const NUM_DISPLAY_ROWS = 10;
const LETTER_LEN = 6;

type KeyProps = {
  char: string;
  keyStatus: string;
  onKeyClick: () => void;
};

function Key({ char, keyStatus, onKeyClick }: KeyProps) {
  return (
    <button className={` ${keyStatus}`} onClick={onKeyClick}>
      {char}
    </button>
  );
}

type KeyboardProps = {
  onLetterClick: (clickedLetter: string) => void;
  finalizeGuess: () => void;
  takeBack: () => void;
  alreadyGuessed: Set<string>;
  correctLetterAndPos: Set<string>;
  correctLetterOnly: Set<string>;
  wordSet: Set<string>;
};

function Keyboard({
  onLetterClick,
  finalizeGuess,
  takeBack,
  alreadyGuessed,
  correctLetterAndPos,
  correctLetterOnly,
  wordSet,
}: KeyboardProps) {
  const letters = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  ); // A-Z
  function handleClick(letter: string) {
    onLetterClick(letter);
  }

  function getLetterColor(letter: string) {
    // If letter in both correctLetterAndPos and correctLetterOnly, it should be green
    if (correctLetterAndPos.has(letter)) {
      return 'green-key';
    } else if (correctLetterOnly.has(letter)) {
      return 'yellow-key';
    } else if (alreadyGuessed.has(letter) && !wordSet.has(letter)) {
      return 'gray-key';
    } else {
      return 'normal-key';
    }
  }

  return (
    <>
      <button onClick={takeBack}>Back</button>
      {letters.map((char, i) => (
        <Key
          key={i}
          char={char}
          keyStatus={getLetterColor(char)}
          onKeyClick={() => handleClick(char)}
        />
      ))}
      <button onClick={finalizeGuess}>Enter</button>
    </>
  );
}

type DisplaysProps = {
  displays: (string | null)[][];
  guessColors: string[][];
};

function Display({ displays, guessColors }: DisplaysProps) {
  return (
    <>
      {displays.map((row, rowIndex) => (
        <div key={rowIndex} className="display-row">
          {row.map((letter, colIndex) => (
            <div key={colIndex} className={guessColors[rowIndex][colIndex]}>
              {letter}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

export default function Wordle() {
  const wordSet = new Set(WORD_TODAY);
  const [alreadyGuessed, setAlreadyGuessed] = useState(new Set<string>());
  const [correctLetterAndPos, setCorrectLetterAndPos] = useState<Set<string>>(
    new Set()
  );
  const [correctLetterOnly, setCorrectLetterOnly] = useState<Set<string>>(
    new Set()
  );

  const [guesses, setGuesses] = useState<(string | null)[][]>(
    Array.from({ length: NUM_DISPLAY_ROWS }, () => Array(LETTER_LEN).fill(null))
  );
  const [guessColors, setGuessColors] = useState<string[][]>(
    Array.from({ length: NUM_DISPLAY_ROWS }, () =>
      Array(LETTER_LEN).fill('empty-key')
    )
  );

  const [displayRow, setDisplayRow] = useState<number>(0);
  const [displayCol, setDisplayCol] = useState<number>(0);

  function handleLetterClick(clickedLetter: string) {
    if (displayCol === LETTER_LEN) {
      return;
    }
    setGuesses(
      guesses.map((row, rowIndex) =>
        rowIndex === displayRow
          ? row.map((char, col) => (col === displayCol ? clickedLetter : char))
          : row
      )
    );
    setDisplayCol(displayCol + 1);
  }

  function takeBackKey() {
    if (displayCol === 0) {
      return;
    }
    const newDisplayCol = displayCol - 1;
    setDisplayCol(newDisplayCol);
    setGuesses(
      guesses.map((row, rowIndex) =>
        rowIndex === displayRow
          ? row.map((char, col) => (col === newDisplayCol ? null : char))
          : row
      )
    );
  }

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  function finalizeGuess() {
    // 6 guesses used already
    if (displayRow === NUM_DISPLAY_ROWS - 1) {
      return;
    }
    const guess = guesses[displayRow].filter(
      (letter): letter is string => letter !== null
    );
    if (guess.length < LETTER_LEN) {
      setErrorMessage('Not enough letters');
      return;
    }

    const guessColor = Array(LETTER_LEN).fill(null);
    guess.forEach((letter, index) => {
      if (wordSet.has(letter)) {
        setCorrectLetterOnly((prevSet) => new Set(prevSet).add(letter));
      }
      if (WORD_TODAY[index] === guess[index]) {
        setCorrectLetterAndPos((prevSet) => new Set(prevSet).add(letter));
      }
      // add colors to displayed guesses
      if (WORD_TODAY[index] === guess[index]) {
        guessColor[index] = 'green-key';
      } else if (wordSet.has(letter)) {
        guessColor[index] = 'yellow-key';
      } else {
        guessColor[index] = 'normal-key';
      }
    });
    setGuessColors(
      guessColors.map((row, rowIndex) =>
        rowIndex === displayRow ? guessColor : row
      )
    );
    setDisplayCol(0);
    setDisplayRow(displayRow + 1);
    setAlreadyGuessed(new Set([...alreadyGuessed, ...(guess as string[])]));
  }
  return (
    <>
      {errorMessage && <div>{errorMessage}</div>}
      <Display displays={guesses} guessColors={guessColors} />
      <Keyboard
        onLetterClick={handleLetterClick}
        finalizeGuess={finalizeGuess}
        takeBack={takeBackKey}
        alreadyGuessed={alreadyGuessed}
        correctLetterAndPos={correctLetterAndPos}
        correctLetterOnly={correctLetterOnly}
        wordSet={wordSet}
      />
    </>
  );
}
