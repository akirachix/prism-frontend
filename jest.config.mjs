import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config = {
  testEnvironment: "jest-fixed-jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],

  testTimeout: 20000,
};

export default async function jestConfig() {
  const resolved = await createJestConfig(config)();
  resolved.transformIgnorePatterns = [
    "^(?!.*/node_modules/(?:msw|@msw|@mswjs|@bundled-es-modules|@open-draft|until-async|rettime|outvariant|strict-event-emitter|headers-polyfill|cookie|tough-cookie)/).*/node_modules/(?!.*\\.mjs$)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return resolved;
}
