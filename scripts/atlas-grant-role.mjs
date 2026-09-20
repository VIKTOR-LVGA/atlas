/**
 * Controlled ATLAS role bootstrap.
 *
 * The product intentionally has no self-service path to `admin`: `set_user_role`
 * already requires an admin, so the very first admin cannot be created in-app.
 * This script is the only sanctioned way to break that cycle and it must be run
 * by a person holding the Supabase service role key, never from the browser.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node --env-file=.env.local \
 *     scripts/atlas-grant-role.mjs <email> <consumer|broker|admin> [--force]
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const ROLES = new Set(["consumer", "broker", "admin"]);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, role, ...flags] = process.argv.slice(2);
const force = flags.includes("--force");

assert.ok(url, "NEXT_PUBLIC_SUPABASE_URL is required");
assert.ok(
  serviceRoleKey,
  "SUPABASE_SERVICE_ROLE_KEY is required. Export it for this command only; never commit it."
);
assert.ok(email && email.includes("@"), "First argument must be the account email");
assert.ok(ROLES.has(role), `Second argument must be one of: ${[...ROLES].join(", ")}`);

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(target) {
  const normalized = target.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    assert.equal(error, null, `listUsers failed: ${error?.message ?? "unknown"}`);
    const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

const user = await findUserByEmail(email);
assert.ok(
  user,
  `No auth account found for ${email}. The person must register in ATLAS first; this script never creates accounts.`
);

const { data: existingAdmins, error: adminError } = await admin
  .from("user_roles")
  .select("user_id")
  .eq("role", "admin");
assert.equal(adminError, null, `admin lookup failed: ${adminError?.message ?? "unknown"}`);

const alreadyAdmin = existingAdmins.some((row) => row.user_id === user.id);
if (role === "admin" && existingAdmins.length > 0 && !alreadyAdmin && !force) {
  console.error(
    `Refusing to add a second admin (${existingAdmins.length} already exist). Re-run with --force if this is intentional.`
  );
  process.exit(1);
}

const { error: upsertError } = await admin
  .from("user_roles")
  .upsert({ user_id: user.id, role }, { onConflict: "user_id" });
assert.equal(upsertError, null, `role assignment failed: ${upsertError?.message ?? "unknown"}`);

const { data: confirmed, error: confirmError } = await admin
  .from("user_roles")
  .select("role, updated_at")
  .eq("user_id", user.id)
  .single();
assert.equal(confirmError, null, `verification failed: ${confirmError?.message ?? "unknown"}`);
assert.equal(confirmed.role, role, "role did not persist");

console.log(
  JSON.stringify(
    {
      action: "role_granted",
      email,
      role: confirmed.role,
      updated_at: confirmed.updated_at,
      note:
        role === "broker"
          ? "Now create the broker record in /admin so the workspace resolves a broker profile."
          : "Role applied. Record this grant in your operations log.",
    },
    null,
    2
  )
);
