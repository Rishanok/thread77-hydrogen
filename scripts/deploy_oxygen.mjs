import {spawn} from 'node:child_process';
import {dirname} from 'node:path';
process.loadEnvFile('.env.oxygen.local');
const token = process.env.SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN;
if (!token) throw new Error('Oxygen deployment token is missing.');
const isProduction = process.argv.includes('--production') || process.argv.includes('--prod');
const deployArgs = [
  'shopify',
  'hydrogen',
  'deploy',
  ...(isProduction ? [] : ['--preview']),
  '--force',
  '--env-file',
  '.env',
  '--metadata-description',
  isProduction
    ? 'Thread77 production storefront: collections, product pages and interactive hero'
    : 'Thread77 preview storefront: collections, product pages and interactive hero',
];

const child = spawn('npx', deployArgs, {
  env: {...process.env, CI: 'true', SHOPIFY_CLI_NO_ANALYTICS: '1', GIT_CEILING_DIRECTORIES: dirname(process.cwd())},
  stdio: ['ignore', 'pipe', 'pipe'],
});
for (const stream of [child.stdout, child.stderr]) {
  let pending = '';
  stream.on('data', chunk => {
    pending += chunk.toString();
    const end = pending.lastIndexOf('\n');
    if (end >= 0) {process.stdout.write(pending.slice(0, end + 1).split(token).join('[REDACTED]'));pending = pending.slice(end + 1);}
  });
  stream.on('end', () => {if(pending) process.stdout.write(pending.split(token).join('[REDACTED]'));});
}
child.on('error', () => {console.error('Could not start Shopify deployment command.');process.exitCode = 1;});
child.on('close', code => {process.exitCode = code ?? 1;});
