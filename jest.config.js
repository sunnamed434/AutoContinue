module.exports = {
    "roots": [
        "test"
    ],
    "transform": {
        "^.+\\.ts$": "ts-jest"
    },
    "testEnvironment": "jsdom",
    "reporters": ["default", "github-actions"],
    "setupFilesAfterEnv": ["<rootDir>/test/setup.ts"],
    "testMatch": ["**/test/**/*.test.ts"],
    "collectCoverageFrom": [
        "src/utils/**/*.ts",
        "src/autoconfirm-simple.ts",
        "src/background.ts",
        "src/popup/popup.ts",
        "src/config.ts",
        "!src/**/*.d.ts",
        "!src/types/**/*",
    ],
    "coverageThreshold": {
        "global": {
            "lines": 60
        }
    },
    "coverageReporters": ["json-summary", "text", "lcov"]
};
