/**
 * 打包脚本：把 dist 产物内联为单个 self-contained HTML 文件。
 * 目的：让用户可以直接双击打开，无需任何本地服务器。
 * 字体以 base64 内联，杜绝任何外部请求。
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

// ---- 定位构建产物 ----
const assetDir = path.join(dist, 'assets');
const jsFile = fs.readdirSync(assetDir).find((f) => f.endsWith('.js'));
const cssFile = fs.readdirSync(assetDir).find((f) => f.endsWith('.css'));
if (!jsFile || !cssFile) throw new Error('未找到构建产物 JS/CSS');

let js = fs.readFileSync(path.join(assetDir, jsFile), 'utf8');
let css = fs.readFileSync(path.join(assetDir, cssFile), 'utf8');
const favicon = fs.readFileSync(path.join(dist, 'favicon.svg'), 'utf8');

// ---- 内联字体（base64） ----
const fontDir = path.join(dist, 'fonts');
const fontMap = {};
for (const f of fs.readdirSync(fontDir)) {
  const b64 = fs.readFileSync(path.join(fontDir, f)).toString('base64');
  fontMap[f] = `data:font/woff2;base64,${b64}`;
}
css = css.replace(/url\((['"]?)\.\.\/fonts\/([^'")]+)\1\)/g, (m, q, name) => {
  const data = fontMap[name];
  if (!data) {
    console.warn('字体未找到:', name);
    return m;
  }
  return `url("${data}")`;
});

// ---- 内联 favicon ----
const faviconData = `data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}`;

// ---- 组装单文件 ----
let out = html;

// 替换 CSS link 为内联 style（必须在 JS 之前）
out = out.replace(/<link rel="stylesheet"[^>]*>/g, '');
out = out.replace('</head>', `  <style>\n${css}\n  </style>\n</head>`);

// 替换 favicon href
out = out.replace(/href="[^"]*favicon\.svg"/, `href="${faviconData}"`);

// 替换 module script 为内联脚本
// —— 关键：使用 base64 data URI + Blob 加载，彻底规避 HTML 解析器
//    对脚本内容里 "</script" 字面量的误判。
const jsB64 = Buffer.from(js, 'utf8').toString('base64');
const loader = `
(function () {
  var b64 = "${jsB64}";
  var bin = atob(b64);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  var blob = new Blob([bytes], { type: "text/javascript" });
  var url = URL.createObjectURL(blob);
  var s = document.createElement("script");
  s.type = "module";
  s.src = url;
  s.onload = function () { URL.revokeObjectURL(url); };
  document.head.appendChild(s);
})();
`;

out = out.replace(
  /<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/,
  `<script>${loader}</script>`,
);

const outFile = path.join(root, 'epsilon-delta-lab.单文件版.html');
fs.writeFileSync(outFile, out, 'utf8');

const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(0);
console.log(`已生成单文件版: ${path.basename(outFile)}  (${kb} KB)`);
