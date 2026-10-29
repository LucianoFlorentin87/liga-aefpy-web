const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'assets', 'committee');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
const allowed = new Set(['public/logo-comite-aefpy.png', 'public/documentos/Reglamento_AEFPY_v1.1.pdf']);
if (manifest.length !== allowed.size) throw new Error('Incomplete committee asset manifest');
const seen = new Set();
const decoded = manifest.map(asset => {
  if (!allowed.has(asset.path) || seen.has(asset.path)) throw new Error('Unexpected committee asset');
  seen.add(asset.path);
  if (!Array.isArray(asset.parts) || !asset.parts.length) throw new Error('Missing asset parts');
  const encoded = asset.parts.map(part => {
    if (!/^[a-z0-9-]+\.b64$/.test(part)) throw new Error('Invalid asset part name');
    return fs.readFileSync(path.join(source, part), 'utf8');
  }).join('');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4) throw new Error('Invalid asset encoding');
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length !== asset.size || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) {
    throw new Error('Committee asset integrity check failed: ' + asset.path);
  }
  return { destination: path.join(root, asset.path), bytes };
});
for (const asset of decoded) {
  fs.mkdirSync(path.dirname(asset.destination), { recursive: true });
  fs.writeFileSync(asset.destination, asset.bytes);
}
console.log('Committee logo and regulation restored; SHA-256 verified.');
