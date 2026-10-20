// Netlify hosts a redirect entry. The full Python app remains on its backend host.
const fs = require('node:fs');
const path = require('node:path');
const raw = process.env.DEMO_APP_URL || '';
let target;
try { target = new URL(raw); } catch { throw new Error('Set DEMO_APP_URL to the live HTTPS application origin.'); }
if (target.protocol !== 'https:' || target.username || target.password ||
    target.search || target.hash || target.pathname !== '/') {
  throw new Error('DEMO_APP_URL must be an HTTPS origin, with no credentials, query or path.');
}
for (const key of ['URL', 'DEPLOY_PRIME_URL', 'DEPLOY_URL']) {
  if (process.env[key] && new URL(process.env[key]).origin === target.origin) {
    throw new Error('DEMO_APP_URL points to this Netlify site and would create a redirect loop.');
  }
}
const out = path.resolve(__dirname, '../dist/netlify-entry');
fs.mkdirSync(out, { recursive: true });
const url = target.origin + '/';
fs.writeFileSync(path.join(out, '_redirects'), '/ ' + url + ' 302!\n');
fs.writeFileSync(path.join(out, 'index.html'),
  '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>个人知识库与事务助手</title>' +
  '<p><a href="' + url + '">打开网页版演示</a></p></html>\n');
console.log('Netlify entry generated. Login, uploads and chat run on the backend origin.');
