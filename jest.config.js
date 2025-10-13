export default {
    "roots": [
        "test"
    ],
    "transform": {
        "^.+\\.ts$": "ts-jest"
    },
    "testEnvironment": "jsdom",
    "testEnvironmentOptions": {
        "url": "https://www.youtube.com/watch?v=test"
    },
    "reporters": ["default", "github-actions"],
    "setupFilesAfterEnv": [],
    "testMatch": ["**/test/**/*.test.ts"],
    "collectCoverageFrom": [
        "src/utils/**/*.ts",
        "src/autoconfirm.ts",
        "src/background.ts",
        "src/popup/popup.ts",
        "src/config.ts",
        "!src/**/*.d.ts",
        "!src/types/**/*",
    ],
    "coverageThreshold": {
        "global": {
            "lines": 0
        }
    },
    "coverageReporters": ["json-summary", "text", "lcov"]
};
