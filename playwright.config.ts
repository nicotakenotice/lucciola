import { defineConfig, devices } from '@playwright/test';

// A dedicated port keeps tests away from a dev server the owner may be using on 8080
const PORT = 5174;

export default defineConfig({
    testDir: 'e2e',
    fullyParallel: true,
    // WebGL is software-rendered in headless browsers: more workers only slow every game down
    workers: 3,
    retries: 0,
    reporter: [ [ 'list' ] ],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure'
    },
    webServer: {
        command: `npx vite --config vite/config.dev.mjs --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
        timeout: 60_000
    },
    projects: [
        {
            name: 'desktop',
            testMatch: /desktop\/.*\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }
        },
        {
            name: 'android',
            testMatch: /mobile\/.*\.spec\.ts/,
            use: { ...devices['Pixel 7'] }
        },
        {
            name: 'iphone',
            testMatch: /mobile\/.*\.spec\.ts/,
            use: { ...devices['iPhone 14'] }
        }
    ]
});
