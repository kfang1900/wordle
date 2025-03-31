type KeyProps = {
  char: string;
  keyColor: string;
  onKeyClick: () => void;
};

export default function Key({ char, keyColor, onKeyClick }: KeyProps) {
  return (
    <button className={`key ${keyColor}`} onClick={onKeyClick}>
      {char}
    </button>
  );
}
