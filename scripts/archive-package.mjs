#!/usr/bin/env node

/**
 * 归档发布包到 releases/ 目录
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(process.argv[1] || import.meta.url);
const rootDir = path.resolve(__dirname, '..');

// 获取版本号
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version;

// 检查 tag 是否存在（仅在正式发布时归档）
try {
  const tags = execSync(`git tag -l "v${version}"`, { encoding: 'utf-8', stdio: 'pipe' });
  if (!tags.trim()) {
    console.log(`⚠️  Tag v${version} not found. Skipping archive.`);
    console.log(`   Run: git tag v${version} && git push origin v${version}`);
    process.exit(0);
  }
} catch {
  console.log(`⚠️  Tag v${version} not found. Skipping archive.`);
  process.exit(0);
}

// 创建 releases 目录
const releasesDir = path.join(rootDir, 'releases', `v${version}`);
fs.mkdirSync(releasesDir, { recursive: true });

// 复制发布包
const sourceZip = path.join(rootDir, `SlideNote-v${version}.zip`);
const targetZip = path.join(releasesDir, `SlideNote-v${version}.zip`);

if (fs.existsSync(sourceZip)) {
  fs.copyFileSync(sourceZip, targetZip);
  console.log(`✓ Archived to: ${targetZip}`);
} else {
  console.log(`⚠️  Package not found: ${sourceZip}`);
}
