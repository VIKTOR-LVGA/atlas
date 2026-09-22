/**
 * Self-cleaning Intelligence QA — membership + aggregate RPC + cleanup.
 * Never leaves synthetic analytics facts in Production.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const stamp = Date.now();
const email = `qa.intelligence.${stamp}@atlas-qa.invalid`;
const password = `QaIntel-${stamp}!`;

const cleanup = {
  userId: /** @type {string|null} */ (null),
  companyId: /** @type {string|null} */ (null),
  applicationId: /** @type {string|null} */ (null),
  membershipId: /** @type {string|null} */ (null),
};

async function main() {
  console.log("=== Intelligence QA start ===");

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  cleanup.userId = created.user.id;

  await admin.from("profiles").upsert({
    id: cleanup.userId,
    email,
    full_name: "QA Intelligence",
    role: "consumer",
  });

  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: signErr } = await client.auth.signInWithPassword({ email, password });
  if (signErr) throw signErr;

  const { data: app, error: appErr } = await client
    .from("intelligence_applications")
    .insert({
      user_id: cleanup.userId,
      first_name: "QA",
      last_name: "Intel",
      work_email: email,
      company_name: `QA Intel Co ${stamp}`,
      company_type: "insurer",
      access_reason: "QA automated validation of ATLAS Intelligence privacy-safe access",
      desired_modules: ["market_overview", "switching", "premium_benchmark"],
      consent_given_at: new Date().toISOString(),
      status: "submitted",
    })
    .select("id")
    .single();
  if (appErr) throw appErr;
  cleanup.applicationId = app.id;

  const { data: company, error: coErr } = await admin
    .from("intelligence_companies")
    .insert({
      legal_name: `QA Intel Legal ${stamp}`,
      display_name: `QA Intel Co ${stamp}`,
      company_type: "insurer",
      status: "active",
      module_access: [
        "market_overview",
        "switching",
        "premium_benchmark",
        "coverage_benchmark",
        "geography",
        "insurer_comparison",
        "reports",
      ],
    })
    .select("id")
    .single();
  if (coErr) throw coErr;
  cleanup.companyId = company.id;

  const { data: mem, error: memErr } = await admin
    .from("intelligence_memberships")
    .insert({
      company_id: cleanup.companyId,
      user_id: cleanup.userId,
      member_role: "viewer",
      active: true,
    })
    .select("id")
    .single();
  if (memErr) throw memErr;
  cleanup.membershipId = mem.id;

  await admin
    .from("intelligence_applications")
    .update({ status: "approved", company_id: cleanup.companyId })
    .eq("id", cleanup.applicationId);

  await client.auth.signOut();
  await client.auth.signInWithPassword({ email, password });

  const { data: hasAccess, error: hasErr } = await client.rpc("has_atlas_intelligence");
  console.log("has_atlas_intelligence", hasAccess, hasErr?.message ?? null);
  if (!hasAccess) throw new Error("expected intelligence access");

  const { data: summary, error: sumErr } = await client.rpc(
    "get_intelligence_dashboard_summary"
  );
  if (sumErr) throw sumErr;
  if (!summary?.minimum_cohort_size) throw new Error("missing min cohort in summary");
  console.log("dashboard_summary ok k=", summary.minimum_cohort_size);

  const { data: market, error: mErr } = await client.rpc("get_intelligence_market_overview");
  if (mErr) throw mErr;
  for (const row of market ?? []) {
    if (row.sample_status === "insufficient_sample") {
      if (row.median_premium != null || row.observed_policies != null) {
        throw new Error("leaked metrics on insufficient_sample");
      }
    }
  }
  console.log("market rows", (market ?? []).length, "privacy check ok");

  const { data: facts } = await client.from("analytics_policy_fact").select("id").limit(1);
  if (facts && facts.length > 0) {
    throw new Error("Intelligence partner must not SELECT analytics_policy_fact");
  }
  console.log("raw fact denial ok");

  await admin
    .from("intelligence_companies")
    .update({ module_access: ["market_overview"] })
    .eq("id", cleanup.companyId);
  const { error: premDeny } = await client.rpc("get_intelligence_premiums");
  if (!premDeny?.message?.includes("premium_benchmark")) {
    throw new Error(`expected module denial, got: ${premDeny?.message}`);
  }
  console.log("premium without entitlement denied ok");

  console.log("=== Intelligence QA PASS ===");
}

async function cleanupAll() {
  console.log("cleanup…");
  if (cleanup.membershipId) {
    await admin.from("intelligence_memberships").delete().eq("id", cleanup.membershipId);
  }
  if (cleanup.applicationId) {
    await admin.from("intelligence_applications").delete().eq("id", cleanup.applicationId);
  }
  if (cleanup.companyId) {
    await admin.from("intelligence_companies").delete().eq("id", cleanup.companyId);
  }
  if (cleanup.userId) {
    await admin.from("profiles").delete().eq("id", cleanup.userId);
    await admin.auth.admin.deleteUser(cleanup.userId);
  }
  console.log("cleanup done");
}

main()
  .catch((e) => {
    console.error("FAIL", e);
    process.exitCode = 1;
  })
  .finally(() => cleanupAll());
