import assert from "node:assert/strict";
import { isBrokerPortalEnabled, isBrokerPortalPath } from "../lib/broker-portal-flags";
import { getSafeAuthRedirect } from "../lib/auth-redirect";

assert.equal(isBrokerPortalEnabled(), false, "broker portal defaults OFF");
assert.equal(isBrokerPortalPath("/broker"), true);
assert.equal(isBrokerPortalPath("/broker/dashboard"), true);
assert.equal(isBrokerPortalPath("/partner/apply"), true);
assert.equal(isBrokerPortalPath("/intelligence"), false);
assert.equal(isBrokerPortalPath("/intelligence/apply"), false);
assert.equal(isBrokerPortalPath("/consulting"), false);
assert.equal(getSafeAuthRedirect("/broker/dashboard"), "/dashboard");
assert.equal(getSafeAuthRedirect("/partner/apply"), "/dashboard");
assert.equal(
  getSafeAuthRedirect("/broker/dashboard", { brokerPortalEnabled: true }),
  "/broker/dashboard"
);

// Partner paths are Broker Workspace legacy — never Intelligence.
assert.equal(isBrokerPortalPath("/control-center/intelligence"), false);
assert.equal(isBrokerPortalPath("/intelligence/apply/status"), false);

console.log("broker-portal-hibernate:ok");
