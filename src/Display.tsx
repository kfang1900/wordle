export type DisplaysProps = {
  displays: (string | null)[][];
  guessColors: string[][];
};

export default function Display({ displays, guessColors }: DisplaysProps) {
  return (
    <div className="board">
      {displays.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {' '}
          {/* ✅ Keeps letters left-to-right */}
          {row.map((letter, colIndex) => (
            <div
              key={colIndex}
              className={`key ${letter ? guessColors[rowIndex][colIndex] : 'empty-key'}`}
            >
              {letter}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
