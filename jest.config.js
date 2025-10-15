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
};
