// Zips the production build for itch.io (index.html must sit at the root of the archive).
// Run through `npm run package`, which builds and checks dist/ first.
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const archive = resolve('lucciola-web.zip');

if (!existsSync('dist/index.html'))
{
    console.error('package: dist/index.html is missing, run the build first');
    process.exit(1);
}

rmSync(archive, { force: true });
execFileSync('zip', [ '-qr', archive, '.' ], { cwd: 'dist', stdio: 'inherit' });

const kb = Math.round(statSync(archive).size / 1024);
console.log(`package: ${archive} (${kb} KB)`);
