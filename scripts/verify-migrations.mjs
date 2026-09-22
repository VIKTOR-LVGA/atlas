#!/usr/bin/env node
/**
 * Verify migration filenames are unique and ordered.
 */
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const ids = files.map((f) => f.split("_")[0]);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);

if (dup.length) {
  console.error("Duplicate migration IDs:", [...new Set(dup)]);
  process.exit(1);
}

console.log(`migrations ok: ${files.length} files`);
for (const f of files.slice(-8)) console.log(" ", f);
