import "@testing-library/jest-dom";

import { resetMockData } from "@/mocks/reset";
import { clearSession } from "@/services/session";
import { clearSelectedChild } from "@/screens/parent/selectedChild";
import { server } from "./server";

window.scrollTo = () => {};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetMockData();
  clearSession();
  clearSelectedChild();
});
afterAll(() => server.close());
