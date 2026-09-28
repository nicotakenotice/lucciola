// Checks the production bundle for things that must never ship, and that the installable app
// (manifest, icons, service worker precache) is complete.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = [
    { pattern: '__LUCCIOLA__', reason: 'dev-only test hook' },
    { pattern: 'fonts.googleapis.com', reason: 'fonts must be self-hosted' },
    { pattern: 'fonts.gstatic.com', reason: 'fonts must be self-hosted' }
];

const files = [];
const walk = (dir) =>
{
    for (const entry of readdirSync(dir, { withFileTypes: true }))
    {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (/\.(js|css|html)$/.test(entry.name)) files.push(path);
    }
};
walk('dist');

let failed = false;
for (const file of files)
{
    const text = readFileSync(file, 'utf8');
    for (const { pattern, reason } of forbidden)
    {
        if (text.includes(pattern))
        {
            console.error(`check-dist: ${file} contains "${pattern}" (${reason})`);
            failed = true;
        }
    }
}

const fail = (message) =>
{
    console.error(`check-dist: ${message}`);
    failed = true;
};

const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
for (const { src } of manifest.icons) if (!existsSync(join('dist', src))) fail(`manifest icon ${src} is missing`);
if (!manifest.icons.some((icon) => icon.purpose === 'maskable')) fail('manifest has no maskable icon');

// Everything the game loads must be precached, or it will not start offline
const precached = new Set([ ...readFileSync('dist/sw.js', 'utf8').matchAll(/url:"([^"]+)"/g) ].map((match) => match[1]));
const needed = [ 'index.html', 'manifest.webmanifest', ...readdirSync('dist/assets').filter((name) => !name.endsWith('.woff')).map((name) => `assets/${name}`) ];
for (const path of needed) if (!precached.has(path)) fail(`${path} is not precached by the service worker`);

if (failed) process.exit(1);
console.log(`check-dist: ${files.length} files clean, ${precached.size} files precached for offline play`);
