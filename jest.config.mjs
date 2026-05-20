import nextJest from "next/jest.js"

const createJestConfig = nextJest({
    dir: "./",
})

/** @type {import("jest").Config} */
const customJestConfig = {
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    testEnvironment: "node",
    testMatch: [
        "**/__tests__/**/*.test.ts",
        "**/__tests__/**/*.test.tsx",
    ],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    collectCoverageFrom: [
        "src/**/*.{js,jsx,ts,tsx}",
        "!src/**/*.d.ts",
        "!src/**/__tests__/**",
    ],
}

export default createJestConfig(customJestConfig)
