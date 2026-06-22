import { cpSync, existsSync, lstatSync, readlinkSync, rmSync, symlinkSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const src = resolve('node_modules/material-icon-theme/icons');
const dest = resolve('public/icons/material');

const mode = process.argv[2] || 'symlink';

if (!existsSync(dirname(dest))) {
  mkdirSync(dirname(dest), { recursive: true });
}

if (existsSync(dest)) {
  const stat = lstatSync(dest);
  if (mode === 'copy' && stat.isSymbolicLink()) {
    // Replace symlink with real copy for production
    const target = readlinkSync(dest);
    rmSync(dest);
    cpSync(target.startsWith('.') ? resolve(dest, '..', target) : target, dest, {
      recursive: true,
      force: true,
    });
    console.log('Copied material icons to public/icons/material/');
  }
} else if (mode === 'symlink') {
  try {
    symlinkSync('../../node_modules/material-icon-theme/icons/', dest);
    console.log('Created symlink: public/icons/material/ -> node_modules/material-icon-theme/icons/');
  } catch {
    // fallback: copy
    cpSync(src, dest, { recursive: true, force: true });
    console.log('Copied material icons to public/icons/material/ (symlink failed)');
  }
} else {
  // copy mode
  cpSync(src, dest, { recursive: true, force: true });
  console.log('Copied material icons to public/icons/material/');
}
