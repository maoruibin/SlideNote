#!/usr/bin/env node

/**
 * 根据版本文档生成 CHANGELOG 条目
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(process.argv[1] || import.meta.url);
const rootDir = path.resolve(__dirname, '..');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');

// 获取当前版本号
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version;

// 读取版本文档
const versionDocPath = path.join(rootDir, 'docs/versions', `v${version}`, 'README.md');
let changelogContent = '';

if (fs.existsSync(versionDocPath)) {
  // 从版本文档生成
  const docContent = fs.readFileSync(versionDocPath, 'utf-8');
  changelogContent = extractFromDoc(docContent, version);
} else {
  // 从 git commits 生成
  changelogContent = extractFromCommits(version);
}

// 添加到 CHANGELOG.md
addEntryToChangelog(version, changelogContent);

function extractFromDoc(content, version) {
  const lines = content.split('\n');
  const sections = { new: [], fix: [], optimize: [] };
  let currentSection = null;

  for (const line of lines) {
    if (line.includes('新增') || line.includes('新功能') || line.includes('功能')) {
      currentSection = 'new';
    } else if (line.includes('修复') || line.includes('Bug')) {
      currentSection = 'fix';
    } else if (line.includes('优化') || line.includes('改进')) {
      currentSection = 'optimize';
    }

    if (line.match(/^\s*-\s+/) && currentSection) {
      sections[currentSection].push(line.trim());
    }
  }

  let result = '';
  if (sections.new.length > 0) {
    result += '### 新增\n' + sections.new.map(s => s.replace(/^\s*-\s*/, '- ')).join('\n') + '\n\n';
  }
  if (sections.optimize.length > 0) {
    result += '### 优化\n' + sections.optimize.map(s => s.replace(/^\s*-\s*/, '- ')).join('\n') + '\n\n';
  }
  if (sections.fix.length > 0) {
    result += '### 修复\n' + sections.fix.map(s => s.replace(/^\s*-\s*/, '- ')).join('\n') + '\n\n';
  }

  return result || '### 更新\n请查看版本文档了解详情';
}

function extractFromCommits(version) {
  try {
    // 获取上一个 tag 之后的 commits
    const commits = execSync(`git log $(git describe --tags --abbrev=0 HEAD^..HEAD) --pretty=format:"%s"`, { encoding: 'utf-8' });
    const commitList = commits.trim().split('\n').filter(s => s);

    const features = commitList.filter(s => s.match(/^(feat|新增|添加|增加)/));
    const fixes = commitList.filter(s => s.match(/^(fix|修复|bug)/));
    const others = commitList.filter(s => !s.match(/^(feat|fix|新增|添加|增加|修复|bug)/));

    let result = '';
    if (features.length > 0) {
      result += '### 新增\n' + features.map(s => '- ' + s.replace(/^(feat|新增|添加|增加):\s*/, '')).join('\n') + '\n\n';
    }
    if (fixes.length > 0) {
      result += '### 修复\n' + fixes.map(s => '- ' + s.replace(/^(fix|修复|bug):\s*/, '')).join('\n') + '\n\n';
    }
    if (others.length > 0) {
      result += '### 其他\n' + others.map(s => '- ' + s).join('\n') + '\n\n';
    }

    return result || '### 更新\n请查看 Git log 了解详情';
  } catch {
    return '### 更新\n请查看版本文档或 Git log 了解详情';
  }
}

function addEntryToChangelog(version, content) {
  const date = new Date().toISOString().split('T')[0];
  const entry = `## [${version}] - ${date}\n\n${content}\n`;

  let currentChangelog = '';
  try {
    currentChangelog = fs.readFileSync(changelogPath, 'utf-8');
  } catch {
    currentChangelog = '# 更新日志\n\n';
  }

  // 分割现有 CHANGELOG
  const parts = currentChangelog.split('## ');
  const header = parts[0];
  const existingEntries = parts.slice(1);

  // 写入新内容
  fs.writeFileSync(changelogPath, header + entry + existingEntries.join('## '));
  console.log(`✓ Updated CHANGELOG.md for v${version}`);
}
