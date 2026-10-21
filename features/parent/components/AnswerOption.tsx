interface Props {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function AnswerOption({ label, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`answer ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
    >
      <span className="answer__radio" />
      <span className="answer__label">{label}</span>
    </button>
  );
}
