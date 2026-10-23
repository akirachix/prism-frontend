import { Suspense } from "react";

import TodoView from "./TodoView";

export const metadata = { title: "To do · Mirai" };

export default function TodoPage() {
  return (
    <Suspense fallback={null}>
      <TodoView />
    </Suspense>
  );
}
