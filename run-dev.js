import { spawn } from 'child_process';
import path from 'path';

console.log('================================================');
console.log('  🚀 Starting MEDHUB Unified System (Fullstack)');
console.log('  Backend : http://localhost:5000');
console.log('  Frontend: http://localhost:5173');
console.log('================================================\n');

const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(process.cwd(), 'backend'),
  stdio: 'inherit',
  shell: true
});

const frontend = spawn('npx', ['vite'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\nStopping MEDHUB services...');
  backend.kill();
  frontend.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
