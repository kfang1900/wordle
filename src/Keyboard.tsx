import Key from './Key';

export type KeyboardProps = {
  onLetterClick: (clickedLetter: string) => void;
  finalizeGuess: () => void;
  takeBack: () => void;
  keyboardColors: Record<string, string>;
};

export default function Keyboard({
  onLetterClick,
  finalizeGuess,
  takeBack,
  keyboardColors,
}: KeyboardProps) {
  const letters = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  return (
    <div className="keyboard">
      {letters.map((keyRow, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {rowIndex === 2 && (
            <button className="special-key enter" onClick={finalizeGuess}>
              ⏎
            </button>
          )}
          {keyRow.split('').map((letter, index) => (
            <Key
              key={index}
              char={letter}
              keyColor={keyboardColors[letter]}
              onKeyClick={() => onLetterClick(letter)}
            />
          ))}
          {rowIndex === 2 && (
            <button className="special-key back" onClick={takeBack}>
              &#x2715;
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
