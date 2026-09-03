import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:8080';
const internalToken = process.env.INTERNAL_QUERY_TOKEN ?? 'local-alpha-internal';

type RemoteQuery = { sql: string; params: unknown[]; method: 'run' | 'all' | 'values' | 'get' };

async function callBackend(path: string, payload: unknown) {
  const response = await fetch(`${backendUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-internal-query-token': internalToken },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spring Boot data query failed (${response.status}): ${body.slice(0, 500)}`);
  }
  return response.json();
}

export function getDb() {
  return drizzle(
    async (sql, params, method) => callBackend('/api/internal/query', { sql, params, method }) as Promise<{ rows: unknown[] }>,
    async (batch: RemoteQuery[]) => callBackend('/api/internal/query/batch', batch) as Promise<Array<{ rows: unknown[] }>>,
    { schema },
  );
}
