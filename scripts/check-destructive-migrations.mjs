// Destructive-migration guard — the last line of defence for prod DATA.
//
// Railway ships new code on every push to main; CI's deploy-migrations workflow
// then runs `prisma migrate deploy` against the PROD database. A migration that
// carries a data-destroying statement (DROP TABLE/COLUMN, TRUNCATE, DELETE FROM,
// DROP SCHEMA/DATABASE) would therefore WIPE prod data the moment it merges —
// silently. This script makes that impossible to merge by accident.
//
// Rule: any migration whose SQL contains a data-destructive statement MUST carry
// an explicit acknowledgement marker, on its own comment line:
//
//     -- allow-destructive: <reason>
//
// No marker + destructive SQL  →  the build fails, listing the offending lines.
// The marker forces a human to look at the statement and write down WHY it is
// safe (e.g. "column already dead, contract step of an earlier expand"). Index/
// constraint/view drops are NOT flagged — they don't destroy row data.
//
// This is intentionally a plain, dependency-free Node script so it runs the same
// in CI (`node scripts/check-destructive-migrations.mjs`) and locally.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "prisma/migrations";

// Statements that destroy ROW data. Index/constraint/view drops are excluded on
// purpose — they change shape, not data.
const DESTRUCTIVE = [
  { label: "DROP TABLE", re: /\bDROP\s+TABLE\b/i },
  { label: "DROP COLUMN", re: /\bDROP\s+COLUMN\b/i },
  { label: "TRUNCATE", re: /\bTRUNCATE\b/i },
  { label: "DELETE FROM", re: /\bDELETE\s+FROM\b/i },
  { label: "DROP SCHEMA", re: /\bDROP\s+SCHEMA\b/i },
  { label: "DROP DATABASE", re: /\bDROP\s+DATABASE\b/i },
];

// A line like `-- allow-destructive: <non-empty reason>` anywhere in the file.
const MARKER = /^\s*--\s*allow-destructive:\s*\S/i;

// Strip a trailing `-- …` line comment so we don't flag a DROP mentioned inside
// a comment (and so the marker line itself never counts as destructive SQL).
function stripLineComment(line) {
  const i = line.indexOf("--");
  return i === -1 ? line : line.slice(0, i);
}

function migrationDirs() {
  let entries;
  try {
    entries = readdirSync(MIGRATIONS_DIR);
  } catch {
    return []; // no migrations dir yet
  }
  return entries
    .map((name) => join(MIGRATIONS_DIR, name))
    .filter((p) => {
      try {
        return statSync(p).isDirectory();
      } catch {
        return false;
      }
    });
}

const offenders = [];

for (const dir of migrationDirs()) {
  const sqlPath = join(dir, "migration.sql");
  let sql;
  try {
    sql = readFileSync(sqlPath, "utf8");
  } catch {
    continue; // directory without a migration.sql — ignore
  }

  const acknowledged = sql.split(/\r?\n/).some((l) => MARKER.test(l));

  const hits = [];
  sql.split(/\r?\n/).forEach((rawLine, idx) => {
    const line = stripLineComment(rawLine);
    for (const { label, re } of DESTRUCTIVE) {
      if (re.test(line)) hits.push({ line: idx + 1, label, text: rawLine.trim() });
    }
  });

  if (hits.length > 0 && !acknowledged) {
    offenders.push({ sqlPath, hits });
  }
}

if (offenders.length === 0) {
  console.log("✓ No un-acknowledged destructive migrations.");
  process.exit(0);
}

console.error("\n✗ Destructive migration(s) without an acknowledgement marker:\n");
for (const { sqlPath, hits } of offenders) {
  console.error(`  ${sqlPath}`);
  for (const h of hits) {
    console.error(`    L${h.line}  ${h.label}  →  ${h.text}`);
  }
  console.error("");
}
console.error(
  "These statements DESTROY row data and would wipe it from PRODUCTION on deploy.\n" +
    "If the loss is intended and safe (e.g. the contract step of an earlier expand,\n" +
    "or a column nothing reads any more), add this line to the migration.sql:\n\n" +
    "    -- allow-destructive: <why this is safe>\n\n" +
    "If it is NOT intended, rewrite the migration to be additive (expand → contract).\n" +
    "See AGENTS.md § Database migrations.\n",
);
process.exit(1);
