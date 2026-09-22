import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTodayPriorities,
  deriveNextAction,
  pipelineStageCounts,
} from "../lib/partner-workspace";

describe("partner workspace helpers", () => {
  it("builds deterministic priorities from real statuses", () => {
    const priorities = buildTodayPriorities({
      leads: [
        {
          id: "1",
          clientName: "Mario Rossi",
          status: "assigned",
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          clientName: "Anna Bianchi",
          status: "quoted",
          updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      appointments: [],
      offers: [],
    });
    assert.ok(priorities.some((item) => item.clientName === "Mario Rossi"));
    assert.ok(priorities.some((item) => item.reason.includes("Offerta inviata")));
  });

  it("maps next actions without inventing AI advice", () => {
    assert.equal(deriveNextAction("assigned"), "Contattare il cliente");
    assert.equal(deriveNextAction("quoted"), "Follow-up sull'offerta");
  });

  it("counts pipeline stages including zeros", () => {
    const stages = pipelineStageCounts([
      { id: "1", clientName: "A", status: "contacted", updatedAt: "" },
      { id: "2", clientName: "B", status: "won", updatedAt: "" },
    ]);
    assert.equal(stages.find((s) => s.id === "contacted")?.count, 1);
    assert.equal(stages.find((s) => s.id === "won")?.count, 1);
    assert.equal(stages.find((s) => s.id === "quoted")?.count, 0);
  });
});
