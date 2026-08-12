/**
 * Minimal in-memory stand-in for the exact slice of the Supabase JS query
 * builder that src/analytics/server/ingest.ts actually calls. Not a general
 * Supabase mock — just enough surface (from/upsert/select/eq/maybeSingle,
 * count-only select) to exercise the ingestion logic without a live
 * Postgres connection, per the mission's rule against inventing a
 * "deployed" status: this fake never touches a real database and is used
 * only in tests, never imported by application code.
 */
export interface FakeRunRow {
  run_id: string;
  [key: string]: unknown;
}

export interface FakeDecisionRow {
  run_id: string;
  decision_index: number;
  [key: string]: unknown;
}

export interface FakeEventRow {
  event_uuid: string;
  [key: string]: unknown;
}

export class FakeSupabaseStore {
  events = new Map<string, FakeEventRow>();
  decisions = new Map<string, FakeDecisionRow>();
  runs = new Map<string, FakeRunRow>();
}

function decisionKey(runId: string, decisionIndex: number): string {
  return `${runId}:${decisionIndex}`;
}

export function createFakeSupabaseClient(store: FakeSupabaseStore) {
  return {
    from(table: string) {
      if (table === "analytics_events") {
        return {
          upsert(rows: FakeEventRow[]) {
            for (const row of rows) {
              if (!store.events.has(row.event_uuid)) store.events.set(row.event_uuid, row);
            }
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "analytics_decisions") {
        return {
          upsert(rows: FakeDecisionRow[]) {
            let inserted = 0;
            for (const row of rows) {
              const key = decisionKey(row.run_id, row.decision_index);
              if (!store.decisions.has(key)) {
                store.decisions.set(key, row);
                inserted += 1;
              }
            }
            return Promise.resolve({ error: null, count: inserted });
          },
          select(_columns: string, options?: { count?: string; head?: boolean }) {
            return {
              eq(_column: string, value: string) {
                const count = [...store.decisions.values()].filter(
                  (row) => row.run_id === value,
                ).length;
                if (options?.head) return Promise.resolve({ error: null, count });
                return Promise.resolve({ error: null, count, data: [] });
              },
            };
          },
        };
      }
      if (table === "analytics_runs") {
        return {
          select() {
            return {
              eq(_column: string, value: string) {
                return {
                  maybeSingle() {
                    return Promise.resolve({ data: store.runs.get(value) ?? null, error: null });
                  },
                };
              },
            };
          },
          upsert(row: FakeRunRow) {
            store.runs.set(row.run_id, row);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`FakeSupabaseClient: unexpected table "${table}"`);
    },
  };
}
