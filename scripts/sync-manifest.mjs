#!/usr/bin/env node

/**
 * 将 package.json 的版本号同步到 manifest.json 和 manifest.dev.json
 */

import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(process.argv[1] || import.meta.url);
const rootDir = path.resolve(__dirname, '..');

// 读取 package.json 版本号
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;

// 更新 manifest.json
const manifestPath = path.join(rootDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
manifest.version = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// 更新 manifest.dev.json
const manifestDevPath = path.join(rootDir, 'manifest.dev.json');
const manifestDev = JSON.parse(fs.readFileSync(manifestDevPath, 'utf-8'));
manifestDev.version = version;
fs.writeFileSync(manifestDevPath, JSON.stringify(manifestDev, null, 2) + '\n');

console.log(`✓ Synced version ${version} to manifest files`);
