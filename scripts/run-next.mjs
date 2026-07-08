/**
 * Lightweight Next.js launcher — avoids lockfile patching and caps memory use.
 * Usage: node scripts/run-next.mjs dev|build|start [-- extra args]
 */
import { spawn } from 'node:child_process';

const command = process.argv[2];
const extraArgs = process.argv.slice(3);

if (!command || !['dev', 'build', 'start'].includes(command)) {
  console.error('Usage: node scripts/run-next.mjs <dev|build|start> [next flags...]');
  process.exit(1);
}

// Stop Next from spawning npm to patch all platform SWC binaries on every start.
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = '1';
// Cap Node heap so dev/build cannot consume all system RAM.
process.env.NODE_OPTIONS = ['--max-old-space-size=1536', process.env.NODE_OPTIONS]
  .filter(Boolean)
  .join(' ');

const nextArgs = [command];

// Webpack dev/build uses less RAM than Turbopack on many Windows machines.
if (command === 'dev' || command === 'build') {
  nextArgs.push('--webpack');
}

nextArgs.push(...extraArgs);

const child = spawn('next', nextArgs, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
