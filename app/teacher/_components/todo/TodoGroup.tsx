import "./todo-group.css";

export interface TodoItem {
  id: string;
  name: string;
  text: string;
  action: string;
  urgent?: boolean;
  busy?: boolean;
  onAction: () => void;
}

export default function TodoGroup({
  title,
  items,
}: {
  title: string;
  items: TodoItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="todo-group">
      <h2 className="todo-group__title">{title}</h2>
      <ul className="todo-group__card">
        {items.map((item) => (
          <li key={item.id} className="todo-group__row">
            <span className="todo-group__info">
              <span className="todo-group__name">{item.name}</span>
              <span className="todo-group__text">{item.text}</span>
            </span>
            <button
              type="button"
              className={
                item.urgent
                  ? "todo-group__btn todo-group__btn--primary"
                  : "todo-group__btn"
              }
              disabled={item.busy}
              onClick={item.onAction}
            >
              {item.action}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
