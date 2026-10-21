import "./todo-tabs.css";

export type TodoTab = "all" | "iep" | "evaluation" | "parents";

const TABS: { key: TodoTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "iep", label: "IEP" },
  { key: "evaluation", label: "Evaluations" },
  { key: "parents", label: "Parents" },
];

export default function TodoTabs({
  value,
  onChange,
}: {
  value: TodoTab;
  onChange: (tab: TodoTab) => void;
}) {
  return (
    <div className="todo-tabs" role="group" aria-label="Filter to-do items">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className="todo-tabs__chip"
          aria-pressed={value === tab.key}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
