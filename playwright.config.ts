import { defineConfig, devices } from '@playwright/test';

// Dedicated ports keep tests away from a dev server the owner may be using on 8080
const PORT = 5174;
// CI runners have 2 vCPUs and render WebGL in software: run one browser at a time, allow more time
const CI = !!process.env.CI;
const PREVIEW_PORT = 5176;

export default defineConfig({
    testDir: 'e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // WebGL is software-rendered in headless browsers: more workers only slow every game down,
    // and a busy machine can slow a frame a lot, hence the generous timeouts
    // PW_WORKERS=1 helps when other heavy processes share the machine
    workers: Number(process.env.PW_WORKERS ?? (CI ? 1 : 3)),
    timeout: CI ? 180_000 : 60_000,
    expect: { timeout: CI ? 30_000 : 10_000 },
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
            // Builds, then serves the production build, so e2e works on a fresh clone
            command: `npm run build && npx vite preview --config vite/config.prod.mjs --port ${PREVIEW_PORT} --strictPort`,
            url: `http://localhost:${PREVIEW_PORT}`,
            reuseExistingServer: false,
            timeout: 120_000
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
