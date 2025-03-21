export type DisplaysProps = {
  displays: (string | null)[][];
  guessColors: string[][];
};

export default function Display({ displays, guessColors }: DisplaysProps) {
  return (
    <div className="board">
      {displays.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((letter, colIndex) => (
            <div
              key={colIndex}
              className={`key ${letter ? guessColors[rowIndex][colIndex] : 'empty'}`}
            >
              {letter}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
