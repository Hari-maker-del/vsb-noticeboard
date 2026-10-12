const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const robots = fs.readFileSync(path.join(root, 'public', 'robots.txt'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'public', 'sitemap.xml'), 'utf8');
const checks = [
  ['descriptive page title', /<title>VSB Smart Notice Board \| IT Department Portal<\/title>/i.test(html)],
  ['meta description', /<meta name="description" content="[^"]{50,}">/i.test(html)],
  ['canonical URL', /<link rel="canonical" href="https:\/\/vsb-noticeboard\.onrender\.com\/">/i.test(html)],
  ['Open Graph metadata', /<meta property="og:title"/i.test(html) && /<meta property="og:description"/i.test(html)],
  ['robots file points to sitemap', /Sitemap:\s*https:\/\/vsb-noticeboard\.onrender\.com\/sitemap\.xml/i.test(robots)],
  ['API paths excluded from crawling', /Disallow:\s*\/api\//i.test(robots)],
  ['sitemap includes canonical homepage', /<loc>https:\/\/vsb-noticeboard\.onrender\.com\/<\/loc>/i.test(sitemap)],
  ['sitemap XML has urlset', /<urlset[\s>]/i.test(sitemap) && /<\/urlset>/i.test(sitemap)]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name);
  if (!ok) failed++;
}
if (failed) {
  console.error('SEO audit failed: ' + failed + ' check(s).');
  process.exitCode = 1;
} else {
  console.log('SEO audit passed: ' + checks.length + ' checks.');
}
