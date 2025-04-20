// vercel-build.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Проверяем существование package.json
if (!fs.existsSync('package.json')) {
  console.error('Error: package.json not found');
  process.exit(1);
}

console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Проверяем наличие vite в node_modules
if (!fs.existsSync(path.join('node_modules', '.bin', 'vite'))) {
  console.error('Error: vite not found in node_modules');
  console.log('Installing vite...');
  execSync('npm install vite', { stdio: 'inherit' });
}

console.log('Building project...');
try {
  // Используем прямой путь к vite для сборки
  execSync('node node_modules/vite/bin/vite.js build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build error:', error.message);
  process.exit(1);
} 
 
 
 
 
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Проверяем существование package.json
if (!fs.existsSync('package.json')) {
  console.error('Error: package.json not found');
  process.exit(1);
}

console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Проверяем наличие vite в node_modules
if (!fs.existsSync(path.join('node_modules', '.bin', 'vite'))) {
  console.error('Error: vite not found in node_modules');
  console.log('Installing vite...');
  execSync('npm install vite', { stdio: 'inherit' });
}

console.log('Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build error:', error.message);
  process.exit(1);
} 
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Проверяем существование package.json
if (!fs.existsSync('package.json')) {
  console.error('Error: package.json not found');
  process.exit(1);
}

console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Проверяем наличие vite в node_modules
if (!fs.existsSync(path.join('node_modules', '.bin', 'vite'))) {
  console.error('Error: vite not found in node_modules');
  console.log('Installing vite...');
  execSync('npm install vite', { stdio: 'inherit' });
}

console.log('Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build error:', error.message);
  process.exit(1);
} 
 
 
 
 
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Проверяем существование package.json
if (!fs.existsSync('package.json')) {
  console.error('Error: package.json not found');
  process.exit(1);
}

console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Проверяем наличие vite в node_modules
if (!fs.existsSync(path.join('node_modules', '.bin', 'vite'))) {
  console.error('Error: vite not found in node_modules');
  console.log('Installing vite...');
  execSync('npm install vite', { stdio: 'inherit' });
}

console.log('Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build error:', error.message);
  process.exit(1);
} 
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Проверяем существование package.json
if (!fs.existsSync('package.json')) {
  console.error('Error: package.json not found');
  process.exit(1);
}

console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Проверяем наличие vite в node_modules
if (!fs.existsSync(path.join('node_modules', '.bin', 'vite'))) {
  console.error('Error: vite not found in node_modules');
  console.log('Installing vite...');
  execSync('npm install vite', { stdio: 'inherit' });
}

console.log('Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build error:', error.message);
  process.exit(1);
} 
 
 
 
 
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Проверяем существование package.json
if (!fs.existsSync('package.json')) {
  console.error('Error: package.json not found');
  process.exit(1);
}

console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Проверяем наличие vite в node_modules
if (!fs.existsSync(path.join('node_modules', '.bin', 'vite'))) {
  console.error('Error: vite not found in node_modules');
  console.log('Installing vite...');
  execSync('npm install vite', { stdio: 'inherit' });
}

console.log('Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build error:', error.message);
  process.exit(1);
} 
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Проверяем существование package.json
if (!fs.existsSync('package.json')) {
  console.error('Error: package.json not found');
  process.exit(1);
}

console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Проверяем наличие vite в node_modules
if (!fs.existsSync(path.join('node_modules', '.bin', 'vite'))) {
  console.error('Error: vite not found in node_modules');
  console.log('Installing vite...');
  execSync('npm install vite', { stdio: 'inherit' });
}

console.log('Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build error:', error.message);
  process.exit(1);
} 
 
 
 
 
 
 