# ESLint toolchain advisory review

Reviewed on 2026-10-19 with `npm audit --json`, `npm audit --omit=dev
--json` and `npm ls ... --all`.

## Result

The five high findings are five nodes in one development-only dependency chain:

```text
eslint-config-next@16.4.2
└─ @next/eslint-plugin-next@16.4.2
   └─ fast-glob@3.3.1
      └─ micromatch@4.0.8
         └─ braces@3.0.3
```

The root advisory is `GHSA-vfj7-8cjw-p6xm`: deeply nested brace patterns can
exhaust the JavaScript stack. The affected range includes `braces@3.0.3`, which
is also the newest release currently published. `npm audit --omit=dev` reports
zero vulnerabilities, so this chain is not installed as a Production runtime
dependency by this project.

## The five reported entries

1. `braces` is the vulnerable parser and the only node with a direct advisory.
2. `micromatch` is marked high because it depends on affected `braces`.
3. `fast-glob` is marked high because it depends on affected `micromatch`.
4. `@next/eslint-plugin-next` is marked high because it depends on affected
   `fast-glob`.
5. `eslint-config-next` is the direct dev dependency and is marked high because
   it includes the affected Next ESLint plugin.

These are not five independent vulnerabilities. They remain five unresolved
audit findings until the root package/advisory receives a safe resolution.

## Decision

Do not run `npm audit fix --force`. npm proposes `eslint-config-next@14.2.35`, a
semver-major downgrade incompatible with the current Next 16 application and
explicitly destructive to the requested upgrade posture. Do not add an
`overrides` entry for an unreleased `braces` version and do not suppress the
advisory globally.

Keep lint input repository-controlled in CI, avoid feeding attacker-controlled
glob patterns to ESLint tooling, retain `npm audit --omit=dev` as the Production
runtime gate, and keep the full audit visible as a known unresolved toolchain
finding. Re-evaluate when `braces`, `micromatch`, or the Next ESLint dependency
chain publishes a compatible fix.
