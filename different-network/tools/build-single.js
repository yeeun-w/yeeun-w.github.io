/**
 * 모든 CSS/JS 를 index.html 하나로 합쳐 dist/index.html 을 만든다.
 * itch.io 업로드, 파일 하나로 공유할 때 사용.   실행: node tools/build-single.js
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) =>
  `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) =>
  `<script>\n/* ${src} */\n${fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script>/g, '<\\/script>')}\n</script>`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);
console.log(`dist/index.html 생성 (${(html.length / 1024).toFixed(1)} KB)`);
