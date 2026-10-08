import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(npm, ['run', 'dev:web'], { stdio: 'inherit' }),
  spawn(npm, ['run', 'worker'], { stdio: 'inherit' }),
];

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }

  process.exitCode = exitCode;
}

for (const child of children) {
  child.once('error', (error) => {
    console.error(error);
    stop(1);
  });

  child.once('exit', (code, signal) => {
    if (!stopping) {
      if (signal) console.error(`Development process exited via ${signal}`);
      stop(code ?? 1);
    }
  });
}

process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));
