// Checks the production bundle for things that must never ship.
import { readdirSync, readFileSync } from 'node:fs';
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

if (failed) process.exit(1);
console.log(`check-dist: ${files.length} files clean`);
