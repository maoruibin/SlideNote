import { copyFileSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';
import sharp from 'sharp';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');

// 获取构建环境: dev | prod (默认 prod)
const buildEnv = process.argv[2] || 'prod';
const isDev = buildEnv === 'dev';

console.log(`\n📦 Building for: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}\n`);

// 选择对应的 manifest 和 locales
const manifestFile = isDev ? 'manifest.dev.json' : 'manifest.json';
const iconSuffix = isDev ? '-dev' : '';

// 清理并重新整理 dist 目录
try {
  // 1. 复制对应的 manifest.json
  copyFileSync(join(__dirname, '..', manifestFile), join(distDir, 'manifest.json'));
  console.log(`✓ Copied ${manifestFile}`);

  // 2. 复制 background.js
  copyFileSync(join(__dirname, '..', 'src', 'background.js'), join(distDir, 'background.js'));
  console.log('✓ Copied background.js');

  // 3. 处理图标
  const srcIconsDir = join(__dirname, '..', 'public', 'icons');
  const dstIconsDir = join(distDir, 'icons');
  mkdirSync(dstIconsDir, { recursive: true });

  // 3.1 生成扩展图标 PNG（用于 Chrome 扩展列表显示）
  const iconSizes = [16, 32, 48, 128];
  const iconBaseName = isDev ? 'icon-dev' : 'icon';

  for (const size of iconSizes) {
    const pngFile = join(dstIconsDir, `icon-${size}.png`);

    if (isDev) {
      // 开发版：从 SVG 转换为 PNG
      const svgFile = join(srcIconsDir, `${iconBaseName}.svg`);
      await sharp(svgFile)
        .resize(size, size)
        .png()
        .toFile(pngFile);
    } else {
      // 正式版：直接复制 PNG 文件
      const srcPng = join(srcIconsDir, `icon-${size}.png`);
      copyFileSync(srcPng, pngFile);
    }
  }

  // 3.2 复制所有 SVG 图标（用于界面显示）
  const allIcons = readdirSync(srcIconsDir, { withFileTypes: true });
  let svgCount = 0;
  for (const icon of allIcons) {
    if (icon.isFile() && icon.name.endsWith('.svg')) {
      copyFileSync(join(srcIconsDir, icon.name), join(dstIconsDir, icon.name));
      svgCount++;
    }
  }
  console.log(`✓ Generated ${iconSizes.length} PNG icons (${isDev ? 'DEV (orange)' : 'PROD (dark)'}) + ${svgCount} SVG icons`);

  // 4. 复制对应的 _locales 目录（国际化文件）
  const srcLocalesDir = join(__dirname, '..', '_locales');
  const dstLocalesDir = join(distDir, '_locales');

  const copyLocaleDir = (src, dst) => {
    mkdirSync(dst, { recursive: true });
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const dstPath = join(dst, entry.name);
      if (entry.isDirectory()) {
        copyLocaleDir(srcPath, dstPath);
      } else {
        copyFileSync(srcPath, dstPath);
      }
    }
  };

  // 复制所有 locale 目录
  const localeEntries = readdirSync(srcLocalesDir, { withFileTypes: true });
  for (const entry of localeEntries) {
    if (entry.isDirectory()) {
      const srcLocalePath = join(srcLocalesDir, entry.name);
      const isDevLocale = entry.name.endsWith('.dev');

      if (isDev && isDevLocale) {
        // 开发环境：复制 zh_CN.dev -> zh_CN, en.dev -> en
        const cleanName = entry.name.replace('.dev', '');
        copyLocaleDir(srcLocalePath, join(dstLocalesDir, cleanName));
        console.log(`✓ Copied locale: ${entry.name} -> ${cleanName}`);
      } else if (!isDev && !isDevLocale) {
        // 正式环境：只复制非 .dev 目录
        copyLocaleDir(srcLocalePath, join(dstLocalesDir, entry.name));
        console.log(`✓ Copied locale: ${entry.name}`);
      }
    }
  }

  // 5. 重命名 JS 和 CSS 文件（vite 输出在 dist/ 目录下）
  renameSync(join(distDir, 'index.js'), join(distDir, 'sidepanel.js'));
  renameSync(join(distDir, 'index.css'), join(distDir, 'sidepanel.css'));
  console.log('✓ Renamed index.js -> sidepanel.js, index.css -> sidepanel.css');

  // 6. 创建 sidepanel.html
  const srcHtmlPath = join(distDir, 'src', 'sidepanel', 'index.html');
  const destHtmlPath = join(distDir, 'sidepanel.html');

  let htmlContent = readFileSync(srcHtmlPath, 'utf-8');
  htmlContent = htmlContent.replace(/src="\/index\.js"/g, 'src="./sidepanel.js"');
  htmlContent = htmlContent.replace(/href="\/index\.css"/g, 'href="./sidepanel.css"');

  writeFileSync(destHtmlPath, htmlContent);
  console.log('✓ Created sidepanel.html');

  // 7. 删除 src 目录
  rmSync(join(distDir, 'src'), { recursive: true, force: true });

  // 8. 删除 .DS_Store
  try {
    rmSync(join(distDir, '.DS_Store'), { force: true });
  } catch (e) {
    // ignore
  }

  console.log(`\n✅ Build complete! ${isDev ? '[DEV BUILD - 橙色图标]' : '[PROD BUILD - 深色图标]'}`);
  console.log('\n  Load "dist" in Chrome to test.');
  console.log('\n  Directory structure:');
  console.log('  dist/');
  console.log('  ├── manifest.json');
  console.log('  ├── background.js');
  console.log('  ├── sidepanel.html');
  console.log('  ├── sidepanel.js');
  console.log('  ├── sidepanel.css');
  console.log('  ├── icons/');
  console.log('  └── _locales/');
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
