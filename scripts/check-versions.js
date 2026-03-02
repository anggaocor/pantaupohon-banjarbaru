const pkg = require('../package.json');

console.log('📦 Versi Dependencies:');
console.log('----------------------');
console.log(`Next.js: ${pkg.dependencies.next}`);
console.log(`React: ${pkg.dependencies.react}`);
console.log(`React DOM: ${pkg.dependencies['react-dom']}`);
console.log(`React Server DOM Webpack: ${pkg.dependencies['react-server-dom-webpack']}`);
console.log('----------------------');

const vulnerableVersions = {
  next: '14.2.21',
  react: '18.3.1',
  'react-dom': '18.3.1',
  'react-server-dom-webpack': '18.3.1'
};

let hasVulnerability = false;

Object.keys(vulnerableVersions).forEach(dep => {
  if (pkg.dependencies[dep] < vulnerableVersions[dep]) {
    console.log(`❌ ${dep} versi ${pkg.dependencies[dep]} RENTAN! Minimal ${vulnerableVersions[dep]}`);
    hasVulnerability = true;
  }
});

if (!hasVulnerability) {
  console.log('✅ Semua dependencies aman!');
}