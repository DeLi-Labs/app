#!/usr/bin/env node
/**
 * Seeds synthetic rows into campaign_*_data tables for every campaign in the DB, then
 * updates existing campaign / ip / category / industry / main_stats / account metric
 * columns so they stay consistent with those period rows (sums over hour data, latest
 * hour for emitted snapshot, current-day campaign_day_data for 24h growth + top campaign).
 * Does not insert or delete ip, campaign, category, or industry rows.
 *
 * Usage (from repo root):
 *   yarn workspace @se-2/ponder seed:demo-periods
 *
 * Environment:
 *   DATABASE_URL / DATABASE_PRIVATE_URL — use Postgres (same as Ponder).
 *   DATABASE_SCHEMA — Ponder schema (default: public, same as `ponder dev`).
 *   DEMO_SEED_OVERWRITE=1 — delete existing rows for each generated (license, period)
 *     bucket before insert (WARNING: removes real indexer data for those buckets).
 *   DEMO_SEED_HOURS, DEMO_SEED_DAYS, DEMO_SEED_WEEKS, DEMO_SEED_MONTHS — how many
 *     past buckets per granularity to create per campaign (defaults: 48, 30, 12, 6).
 *
 * PGlite: stop `yarn ponder:dev` first so this process can open the database exclusively.
 * If PGlite fails to start with a WASM abort, the data dir may be locked or dirty — stop
 * other Ponder processes and retry. Column `sqrt_price_x_96_period_start` matches Drizzle
 * `toSnakeCase("sqrtPriceX96PeriodStart")` (X and 96 are separate segments).
 *
 * Inserts run in a transaction with `session_replication_role = replica` so Ponder’s
 * live-query triggers (which expect internal tables like `live_query_tables`) are skipped.
 */

import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PONDER_ROOT = path.join(__dirname, "..");

dotenv.config({ path: path.join(PONDER_ROOT, ".env") });
dotenv.config({ path: path.join(PONDER_ROOT, ".env.local") });

const ONE_HOUR = 3600n;
const ONE_DAY = 24n * ONE_HOUR;
const ONE_WEEK = 7n * ONE_DAY;
const ONE_MONTH = 30n * ONE_DAY;

function assertSafeSchema(name) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid DATABASE_SCHEMA: ${name}`);
  }
}

function alignPeriod(timestamp, window) {
  return (timestamp / window) * window;
}

function rndFloat(a, b) {
  return a + Math.random() * (b - a);
}

function rndBigint(lo, hi) {
  return BigInt(Math.floor(rndFloat(lo, hi + 1)));
}

function scaledSqrtPrice(price) {
  return BigInt(Math.round(Math.max(price, 0) * 1e18));
}

function parseCount(envKey, defaultValue) {
  const v = process.env[envKey];
  if (v === undefined || v === "") return defaultValue;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${envKey} must be a non-negative integer`);
  }
  return n;
}

async function createDbClient() {
  const databaseUrl = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL;
  if (databaseUrl) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();
    return {
      kind: "pg",
      query: (text, params) => client.query(text, params),
      close: async () => {
        client.release();
        await pool.end();
      },
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = path.join(PONDER_ROOT, ".ponder", "pglite");
  const client = new PGlite(dataDir);
  return {
    kind: "pglite",
    query: (text, params) => client.query(text, params),
    close: () => client.close(),
  };
}

function periodStarts(nowSec, count, window) {
  const now = BigInt(nowSec);
  const aligned = alignPeriod(now, window);
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(aligned - BigInt(i) * window);
  }
  return out;
}

function rowValues(licenseAddress, periodStartTimestamp) {
  const basePrice = rndFloat(0.01, 500);
  const highPrice = basePrice * rndFloat(1, 1.15);
  const lowPrice = basePrice * rndFloat(0.85, 1);
  const avgPrice = (highPrice + lowPrice) / 2;
  const growthPercent = rndFloat(-25, 40);
  const retailPercent = rndFloat(0, 100);
  const totalInteractions = rndBigint(0, 200);
  const totalSales = rndBigint(Number(totalInteractions), Number(totalInteractions) + 150);
  return {
    id: randomUUID(),
    period_start_timestamp: periodStartTimestamp.toString(),
    license_address: licenseAddress.toLowerCase(),
    total_emitted_licenses_value_usd: rndFloat(100, 500_000),
    total_trading_volume_usd: rndFloat(50, 250_000),
    sqrt_price_x96_period_start: scaledSqrtPrice(basePrice * rndFloat(0.9, 1.1)).toString(),
    high_price: highPrice,
    low_price: lowPrice,
    avg_price: avgPrice,
    growth_percent: growthPercent,
    retail_percent: retailPercent,
    total_interactions: totalInteractions.toString(),
    total_sales: totalSales.toString(),
  };
}

const INSERT_SQL = (schema, table) => `
INSERT INTO "${schema}"."${table}" (
  id,
  period_start_timestamp,
  license_address,
  total_emitted_licenses_value_usd,
  total_trading_volume_usd,
  sqrt_price_x_96_period_start,
  high_price,
  low_price,
  avg_price,
  growth_percent,
  retail_percent,
  total_interactions,
  total_sales
) SELECT $1::text, $2::numeric, $3::text, $4::float8, $5::float8, $6::numeric, $7::float8, $8::float8, $9::float8, $10::float8, $11::float8, $12::numeric, $13::numeric
WHERE NOT EXISTS (
  SELECT 1 FROM "${schema}"."${table}" x
  WHERE x.license_address = $3 AND x.period_start_timestamp = $2::numeric
)
RETURNING id`;

const DELETE_SQL = (schema, table) => `
DELETE FROM "${schema}"."${table}"
WHERE license_address = $1 AND period_start_timestamp = $2::numeric
`;

const INSERT_SQL_PLAIN = (schema, table) => `
INSERT INTO "${schema}"."${table}" (
  id,
  period_start_timestamp,
  license_address,
  total_emitted_licenses_value_usd,
  total_trading_volume_usd,
  sqrt_price_x_96_period_start,
  high_price,
  low_price,
  avg_price,
  growth_percent,
  retail_percent,
  total_interactions,
  total_sales
) VALUES ($1::text, $2::numeric, $3::text, $4::float8, $5::float8, $6::numeric, $7::float8, $8::float8, $9::float8, $10::float8, $11::float8, $12::numeric, $13::numeric)
RETURNING id`;

async function seedPeriodTable(db, schema, tableName, licenseAddress, periodStartsList, overwrite) {
  let inserted = 0;
  for (const periodStart of periodStartsList) {
    const v = rowValues(licenseAddress, periodStart);
    if (overwrite) {
      await db.query(DELETE_SQL(schema, tableName), [v.license_address, v.period_start_timestamp]);
    }
    const sql = overwrite ? INSERT_SQL_PLAIN(schema, tableName) : INSERT_SQL(schema, tableName);
    const params = [
      v.id,
      v.period_start_timestamp,
      v.license_address,
      v.total_emitted_licenses_value_usd,
      v.total_trading_volume_usd,
      v.sqrt_price_x96_period_start,
      v.high_price,
      v.low_price,
      v.avg_price,
      v.growth_percent,
      v.retail_percent,
      v.total_interactions,
      v.total_sales,
    ];
    const res = await db.query(sql, params);
    const n = res.rows?.length ?? res.rowCount ?? 0;
    inserted += n;
  }
  return inserted;
}

const GLOBAL_STATS_ID = "global";

/** Matches indexer: totalInteractions = non-retail sell count; retailPercent from sales mix. */
function retailPercentFromTotals(totalInteractions, totalSales) {
  const ti = BigInt(totalInteractions);
  const ts = BigInt(totalSales);
  if (ts <= 0n) return 0;
  return (Number(ts - ti) * 100) / Number(ts);
}

/** Roll up hour/day-shaped metrics into entity tables (existing rows only). */
async function syncAggregatedMetricsFromPeriods(db, schema, nowSec) {
  const dayStart = alignPeriod(BigInt(nowSec), ONE_DAY).toString();

  await db.query(
    `
    UPDATE "${schema}".campaign c
    SET
      total_trading_volume_usd = vol.sum_vol,
      total_emitted_licenses_value_usd = le.last_emit
    FROM (
      SELECT license_address, SUM(total_trading_volume_usd)::float8 AS sum_vol
      FROM "${schema}".campaign_hour_data
      GROUP BY license_address
    ) vol
    JOIN (
      SELECT DISTINCT ON (license_address)
        license_address,
        total_emitted_licenses_value_usd::float8 AS last_emit
      FROM "${schema}".campaign_hour_data
      ORDER BY license_address, period_start_timestamp DESC
    ) le ON le.license_address = vol.license_address
    WHERE c.license_address = vol.license_address
    `,
  );

  await db.query(
    `
    WITH hour_agg AS (
      SELECT license_address,
        SUM(total_sales)::numeric AS total_sales,
        SUM(total_interactions)::numeric AS total_interactions
      FROM "${schema}".campaign_hour_data
      GROUP BY license_address
    ),
    ip_hour AS (
      SELECT c.ip_token_id,
        COALESCE(SUM(ha.total_sales), 0)::numeric AS total_sales,
        COALESCE(SUM(ha.total_interactions), 0)::numeric AS total_interactions
      FROM "${schema}".campaign c
      LEFT JOIN hour_agg ha ON ha.license_address = c.license_address
      GROUP BY c.ip_token_id
    ),
    ip_camp AS (
      SELECT ip_token_id,
        SUM(total_trading_volume_usd)::float8 AS ttv,
        SUM(total_emitted_licenses_value_usd)::float8 AS tev
      FROM "${schema}".campaign
      GROUP BY ip_token_id
    ),
    top_g AS (
      SELECT DISTINCT ON (c.ip_token_id)
        c.ip_token_id,
        c.license_address AS top_lic,
        d.growth_percent::float8 AS gp
      FROM "${schema}".campaign c
      INNER JOIN "${schema}".campaign_day_data d ON d.license_address = c.license_address
      WHERE d.period_start_timestamp = $1::numeric
      ORDER BY c.ip_token_id, d.growth_percent DESC NULLS LAST
    )
    UPDATE "${schema}".ip i
    SET
      total_trading_volume_usd = ic.ttv,
      total_emitted_licenses_value_usd = ic.tev,
      total_sales = ih.total_sales,
      total_interactions = ih.total_interactions,
      retail_percent = CASE
        WHEN ih.total_sales > 0 THEN ((ih.total_sales - ih.total_interactions)::float8 * 100.0 / ih.total_sales::float8)
        ELSE 0
      END,
      growth_percent = COALESCE(tg.gp, 0),
      top_growth24h_campaign_license_address = tg.top_lic
    FROM ip_camp ic
    INNER JOIN ip_hour ih ON ih.ip_token_id = ic.ip_token_id
    LEFT JOIN top_g tg ON tg.ip_token_id = ic.ip_token_id
    WHERE i.token_id = ic.ip_token_id
    `,
    [dayStart],
  );

  await db.query(
    `
    WITH hour_agg AS (
      SELECT license_address,
        SUM(total_sales)::numeric AS total_sales,
        SUM(total_interactions)::numeric AS total_interactions,
        SUM(total_trading_volume_usd)::float8 AS ttv
      FROM "${schema}".campaign_hour_data
      GROUP BY license_address
    ),
    cat_roll AS (
      SELECT ip.category_id AS cid,
        SUM(ha.ttv)::float8 AS ttv,
        SUM(c.total_emitted_licenses_value_usd)::float8 AS tev,
        SUM(ha.total_sales)::numeric AS total_sales,
        SUM(ha.total_interactions)::numeric AS total_interactions
      FROM "${schema}".ip ip
      INNER JOIN "${schema}".campaign c ON c.ip_token_id = ip.token_id
      INNER JOIN hour_agg ha ON ha.license_address = c.license_address
      WHERE ip.category_id IS NOT NULL
      GROUP BY ip.category_id
    ),
    top_g AS (
      SELECT DISTINCT ON (ip.category_id)
        ip.category_id AS cid,
        c.license_address AS top_lic,
        d.growth_percent::float8 AS gp
      FROM "${schema}".ip ip
      INNER JOIN "${schema}".campaign c ON c.ip_token_id = ip.token_id
      INNER JOIN "${schema}".campaign_day_data d ON d.license_address = c.license_address
      WHERE ip.category_id IS NOT NULL AND d.period_start_timestamp = $1::numeric
      ORDER BY ip.category_id, d.growth_percent DESC NULLS LAST
    )
    UPDATE "${schema}".category cat
    SET
      total_trading_volume_usd = cr.ttv,
      total_emitted_licenses_value_usd = cr.tev,
      total_sales = cr.total_sales,
      total_interactions = cr.total_interactions,
      retail_percent = CASE
        WHEN cr.total_sales > 0 THEN ((cr.total_sales - cr.total_interactions)::float8 * 100.0 / cr.total_sales::float8)
        ELSE 0
      END,
      growth_percent = COALESCE(tg.gp, 0),
      top_growth24h_campaign_license_address = tg.top_lic
    FROM cat_roll cr
    LEFT JOIN top_g tg ON tg.cid = cr.cid
    WHERE cat.id = cr.cid
    `,
    [dayStart],
  );

  await db.query(
    `
    WITH hour_agg AS (
      SELECT license_address,
        SUM(total_sales)::numeric AS total_sales,
        SUM(total_interactions)::numeric AS total_interactions,
        SUM(total_trading_volume_usd)::float8 AS ttv
      FROM "${schema}".campaign_hour_data
      GROUP BY license_address
    ),
    ind_roll AS (
      SELECT ind.ind AS iid,
        SUM(ha.ttv)::float8 AS ttv,
        SUM(c.total_emitted_licenses_value_usd)::float8 AS tev,
        SUM(ha.total_sales)::numeric AS total_sales,
        SUM(ha.total_interactions)::numeric AS total_interactions
      FROM "${schema}".ip ip
      CROSS JOIN LATERAL unnest(ip.industry) AS ind(ind)
      INNER JOIN "${schema}".campaign c ON c.ip_token_id = ip.token_id
      INNER JOIN hour_agg ha ON ha.license_address = c.license_address
      GROUP BY ind.ind
    ),
    top_g AS (
      SELECT DISTINCT ON (ind.ind)
        ind.ind AS iid,
        c.license_address AS top_lic,
        d.growth_percent::float8 AS gp
      FROM "${schema}".ip ip
      CROSS JOIN LATERAL unnest(ip.industry) AS ind(ind)
      INNER JOIN "${schema}".campaign c ON c.ip_token_id = ip.token_id
      INNER JOIN "${schema}".campaign_day_data d ON d.license_address = c.license_address
      WHERE d.period_start_timestamp = $1::numeric
      ORDER BY ind.ind, d.growth_percent DESC NULLS LAST
    )
    UPDATE "${schema}".industry indu
    SET
      total_trading_volume_usd = ir.ttv,
      total_emitted_licenses_value_usd = ir.tev,
      total_sales = ir.total_sales,
      total_interactions = ir.total_interactions,
      retail_percent = CASE
        WHEN ir.total_sales > 0 THEN ((ir.total_sales - ir.total_interactions)::float8 * 100.0 / ir.total_sales::float8)
        ELSE 0
      END,
      growth_percent = COALESCE(tg.gp, 0),
      top_growth24h_campaign_license_address = tg.top_lic
    FROM ind_roll ir
    LEFT JOIN top_g tg ON tg.iid = ir.iid
    WHERE indu.id = ir.iid
    `,
    [dayStart],
  );

  const { rows: msRows } = await db.query(
    `
    SELECT
      COALESCE(SUM(total_trading_volume_usd), 0)::float8 AS ttv,
      COALESCE(SUM(total_emitted_licenses_value_usd), 0)::float8 AS tev,
      COALESCE(SUM(total_sales), 0)::numeric AS ts,
      COALESCE(SUM(total_interactions), 0)::numeric AS ti,
      COALESCE(
        SUM(growth_percent * NULLIF(total_trading_volume_usd, 0)::float8)
          / NULLIF(SUM(NULLIF(total_trading_volume_usd, 0)::float8), 0),
        0
      )::float8 AS wgp
    FROM "${schema}".ip
    `,
  );
  const ms = msRows[0];
  if (ms) {
    const ts = ms.ts ?? "0";
    const ti = ms.ti ?? "0";
    const retail = retailPercentFromTotals(ti, ts);
    await db.query(
      `
      UPDATE "${schema}".main_stats
      SET
        total_trading_volume_usd = $2::float8,
        total_emitted_licenses_value_usd = $3::float8,
        total_sales = $4::numeric,
        total_interactions = $5::numeric,
        retail_percent = $6::float8,
        growth_percent = $7::float8
      WHERE id = $1::text
      `,
      [GLOBAL_STATS_ID, ms.ttv, ms.tev, ts, ti, retail, ms.wgp ?? 0],
    );
  }

  await db.query(
    `
    UPDATE "${schema}".account a
    SET
      total_emitted_license_value_usd = s.tev,
      total_interactions = s.ti,
      total_swaps = s.ts
    FROM (
      SELECT
        ip.account_address AS addr,
        COALESCE(SUM(ip.total_emitted_licenses_value_usd), 0)::float8 AS tev,
        COALESCE(SUM(ip.total_interactions), 0)::numeric AS ti,
        COALESCE(SUM(ip.total_sales), 0)::numeric AS ts
      FROM "${schema}".ip ip
      GROUP BY ip.account_address
    ) s
    WHERE a.address = s.addr
    `,
  );

  console.log(
    "Synced campaign / ip / category / industry / main_stats / account metrics from seeded period rows.",
  );
}

async function main() {
  const schema = process.env.DATABASE_SCHEMA || "public";
  assertSafeSchema(schema);
  const overwrite = process.env.DEMO_SEED_OVERWRITE === "1";
  const nHours = parseCount("DEMO_SEED_HOURS", 48);
  const nDays = parseCount("DEMO_SEED_DAYS", 30);
  const nWeeks = parseCount("DEMO_SEED_WEEKS", 12);
  const nMonths = parseCount("DEMO_SEED_MONTHS", 6);

  const nowSec = Math.floor(Date.now() / 1000);

  const db = await createDbClient();
  try {
    await db.query("BEGIN");
    try {
      await db.query("SET LOCAL session_replication_role = 'replica'");

      const { rows: campaigns } = await db.query(
        `SELECT license_address FROM "${schema}".campaign`,
      );
      if (campaigns.length === 0) {
        console.warn("No campaigns found; nothing to seed.");
        await db.query("ROLLBACK");
        return;
      }

      const tables = [
        { name: "campaign_hour_data", window: ONE_HOUR, count: nHours },
        { name: "campaign_day_data", window: ONE_DAY, count: nDays },
        { name: "campaign_week_data", window: ONE_WEEK, count: nWeeks },
        { name: "campaign_month_data", window: ONE_MONTH, count: nMonths },
      ];

      let total = 0;
      for (const c of campaigns) {
        const lic = String(c.license_address).toLowerCase();
        for (const t of tables) {
          const periods = periodStarts(nowSec, t.count, t.window);
          const n = await seedPeriodTable(db, schema, t.name, lic, periods, overwrite);
          total += n;
          console.log(`${t.name}: ${n} inserts (0 = skipped existing) for ${lic.slice(0, 10)}…`);
        }
      }

      await syncAggregatedMetricsFromPeriods(db, schema, nowSec);

      await db.query("COMMIT");

      console.log(
        `Done. Sum of rowCount from inserts: ${total} (${overwrite ? "overwrite buckets" : "skipped buckets where row already existed"}).`,
      );
    } catch (e) {
      try {
        await db.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw e;
    }
  } finally {
    await db.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
