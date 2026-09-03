import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const apiRoot = path.join(root, 'app', 'api');
const output = path.join(here, '..', 'src', 'main', 'resources', 'api-contract.json');

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    const target = path.join(directory, item.name);
    return item.isDirectory() ? files(target) : item.name === 'route.ts' ? [target] : [];
  });
}

const routes = [];
for (const file of files(apiRoot)) {
  const route = '/api/' + path.relative(apiRoot, path.dirname(file)).replaceAll('\\', '/').replaceAll('[id]', '{id}');
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/g)) routes.push({ method: match[1], path: route.replace(/\/$/, '') });
}
routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
fs.writeFileSync(output, JSON.stringify({ version: 1, source: 'legacy Next API snapshot 1ce7d17', count: routes.length, routes }, null, 2) + '\n');
console.log(`Captured ${routes.length} API method contracts.`);
