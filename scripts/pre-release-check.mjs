#!/usr/bin/env node

/**
 * 发布前检查
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(process.argv[1] || import.meta.url);
const rootDir = path.resolve(__dirname, '..');

const checks = [
  {
    name: 'Git 工作区干净',
    check: () => {
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf-8' });
        return status.trim() === '';
      } catch {
        return false;
      }
    }
  },
  {
    name: '版本号格式正确',
    check: () => {
      try {
        const pkgPath = path.join(rootDir, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        return /^\d+\.\d+\.\d+$/.test(pkg.version);
      } catch {
        return false;
      }
    }
  },
  {
    name: 'manifest 版本号同步',
    check: () => {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
        const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf-8'));
        return pkg.version === manifest.version;
      } catch {
        return false;
      }
    }
  }
];

console.log('🔍 Running pre-release checks...\n');

let allPassed = true;
for (const check of checks) {
  try {
    const passed = check.check();
    const icon = passed ? '✓' : '✗';
    console.log(`${icon} ${check.name}`);
    if (!passed) allPassed = false;
  } catch {
    console.log(`✗ ${check.name} (检查失败)`);
    allPassed = false;
  }
}

console.log();
if (allPassed) {
  console.log('✅ All checks passed!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix them before releasing.');
  process.exit(1);
}
