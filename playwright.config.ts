import { defineConfig, devices } from '@playwright/test';

// Dedicated ports keep tests away from a dev server the owner may be using on 8080
const PORT = 5174;
const PREVIEW_PORT = 5176;

export default defineConfig({
    testDir: 'e2e',
    fullyParallel: true,
    // WebGL is software-rendered in headless browsers: more workers only slow every game down,
    // and a busy machine can slow a frame a lot, hence the generous timeouts
    workers: 3,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    retries: 0,
    reporter: [ [ 'list' ] ],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure'
    },
    webServer: [
        {
            command: `npx vite --config vite/config.dev.mjs --port ${PORT} --strictPort`,
            url: `http://localhost:${PORT}`,
            reuseExistingServer: false,
            timeout: 60_000
        },
        {
            // Serves the production build: run `npm run build-nolog` first (`npm run verify` does)
            command: `npx vite preview --config vite/config.prod.mjs --port ${PREVIEW_PORT} --strictPort`,
            url: `http://localhost:${PREVIEW_PORT}`,
            reuseExistingServer: false,
            timeout: 60_000
        }
    ],
    projects: [
        {
            name: 'desktop',
            testMatch: /desktop\/.*\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }
        },
        {
            name: 'production',
            testMatch: /production\/.*\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, baseURL: `http://localhost:${PREVIEW_PORT}` }
        },
        {
            name: 'android',
            testMatch: /mobile\/.*\.spec\.ts/,
            use: { ...devices['Pixel 7 landscape'] }
        },
        {
            name: 'iphone',
            testMatch: /mobile\/.*\.spec\.ts/,
            use: { ...devices['iPhone 14 landscape'] }
        }
    ]
});
