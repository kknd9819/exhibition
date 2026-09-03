import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const schemaFile = path.join(root, 'db', 'schema.ts');
const migrationDir = path.join(root, 'drizzle');
const outputDir = path.join(here, '..', 'src', 'main', 'resources', 'db', 'migration');
fs.mkdirSync(outputDir, { recursive: true });

const source = fs.readFileSync(schemaFile, 'utf8').split(/\r?\n/);
const tables = [];
for (let index = 0; index < source.length; index += 1) {
  const start = source[index].match(/^export const (\w+) = sqliteTable\('([^']+)', \{/);
  if (!start) continue;
  const table = { symbol: start[1], name: start[2], columns: [] };
  for (index += 1; index < source.length; index += 1) {
    const line = source[index];
    if (line.includes('...timestamps')) {
      table.columns.push({ name: 'created_at', type: 'text' }, { name: 'updated_at', type: 'text' });
    }
    const columns = [...line.matchAll(/\w+:\s*(text|integer)\('([^']+)'/g)];
    columns.forEach((column, columnIndex) => {
      const end = columnIndex + 1 < columns.length ? columns[columnIndex + 1].index : line.length;
      const declaration = line.slice(column.index, end);
      table.columns.push({ name: column[2], type: column[1], primary: declaration.includes('.primaryKey()') });
    });
    if (/^\s*}\s*(?:,|\))/.test(line)) break;
  }
  tables.push(table);
}

if (tables.length < 70) throw new Error(`Only parsed ${tables.length} tables from db/schema.ts`);
const longText = /(?:json|content|snapshot|schema|description|body|reason|report|payload|answer|document|introduction|result)/;
const ddl = [
  '-- Generated from db/schema.ts. Do not edit by hand.',
  'SET NAMES utf8mb4;',
  ...tables.map((table) => {
    const seen = new Set();
    const columns = table.columns.filter((column) => !seen.has(column.name) && seen.add(column.name));
    const lines = columns.map((column) => {
      const type = column.type === 'integer' ? 'BIGINT' : (longText.test(column.name) ? 'LONGTEXT' : 'TEXT');
      return `  \`${column.name}\` ${column.primary ? 'VARCHAR(191) NOT NULL' : type + ' NULL'}`;
    });
    const primary = columns.find((column) => column.primary) ?? columns.find((column) => column.name === 'id');
    if (primary) lines.push(`  PRIMARY KEY (\`${primary.name}\`)`);
    return `CREATE TABLE IF NOT EXISTS \`${table.name}\` (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
  }),
  `CREATE TABLE IF NOT EXISTS \`api_mutation_log\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`method\` VARCHAR(16) NOT NULL,
  \`path\` VARCHAR(1024) NOT NULL,
  \`actor_name\` VARCHAR(255) NULL,
  \`request_json\` LONGTEXT NULL,
  \`response_json\` LONGTEXT NULL,
  \`occurred_at\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
].join('\n\n');
fs.writeFileSync(path.join(outputDir, 'V1__schema.sql'), ddl, 'utf8');

const seedParts = [fs.readFileSync(path.join(root, 'db', 'seed.sql'), 'utf8')];
for (const name of fs.readdirSync(migrationDir).filter((name) => /^00(?:1[1-9]|2\d)_.*\.sql$/.test(name)).sort()) {
  const sql = fs.readFileSync(path.join(migrationDir, name), 'utf8').replaceAll('--> statement-breakpoint', '');
  for (const statement of sql.split(';')) {
    if (/^\s*(INSERT|UPDATE)\b/i.test(statement)) seedParts.push(`${statement.trim()};`);
  }
}
const seed = seedParts.join('\n\n')
  .replace(/INSERT\s+OR\s+IGNORE/gi, 'INSERT IGNORE')
  .replace(/\byear\b/g, '`year`')
  .replace(/'EXPO-'\s*\|\|\s*upper\(substr\(hex\(randomblob\(8\)\),1,16\)\)/gi,
    "CONCAT('EXPO-', UPPER(SUBSTR(REPLACE(UUID(),'-',''),1,16)))")
  .replace(/'([^']*)'\s*\|\|\s*id/g, "CONCAT('$1', id)");
fs.writeFileSync(path.join(outputDir, 'V2__seed.sql'), `-- Converted Alpha seed data\nSET NAMES utf8mb4;\n${seed}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'table-whitelist.txt'), tables.map((table) => table.name).sort().join('\n') + '\n', 'utf8');
console.log(`Generated ${tables.length} MySQL tables and seed data.`);
