import { describe, it, expect } from "vitest";

describe("Participant Status and Reset Logic", () => {
  it("determines status as 'winner' only if participant ID exists in winners list", () => {
    const winnerIds = new Set(["winner-1", "winner-2"]);
    const statuses: Record<string, "new" | "contacted" | "winner"> = {
      "user-a": "contacted",
      "user-b": "winner", // Stale or invalid status without being in raffle winners
      "winner-1": "new",
    };

    const resolveStatus = (id: string): "new" | "contacted" | "winner" => {
      const isWinner = winnerIds.has(id);
      return isWinner
        ? "winner"
        : statuses[id] === "winner"
        ? "new"
        : statuses[id] || "new";
    };

    expect(resolveStatus("winner-1")).toBe("winner");
    expect(resolveStatus("winner-2")).toBe("winner");
    expect(resolveStatus("user-a")).toBe("contacted");
    // "user-b" was not drawn in raffle, so even if stale "winner" existed, it resolves to "new"
    expect(resolveStatus("user-b")).toBe("new");
    // Unlisted user defaults to "new"
    expect(resolveStatus("user-unknown")).toBe("new");
  });

  it("resets all previous winners to default 'new' upon raffle reset", () => {
    const previousWinners = [
      { participant_id: "p-1", name: "Ahmed" },
      { participant_id: "p-2", name: "Sara" },
    ];

    const currentStatuses: Record<string, "new" | "contacted" | "winner"> = {
      "p-1": "winner",
      "p-2": "winner",
      "p-3": "contacted",
      "p-4": "new",
    };

    // Simulate reset logic
    const winnerIdsToReset = previousWinners.map((w) => w.participant_id);
    const nextStatuses = { ...currentStatuses };

    winnerIdsToReset.forEach((id) => {
      nextStatuses[id] = "new";
    });
    for (const id in nextStatuses) {
      if (nextStatuses[id] === "winner") {
        nextStatuses[id] = "new";
      }
    }

    expect(nextStatuses["p-1"]).toBe("new");
    expect(nextStatuses["p-2"]).toBe("new");
    expect(nextStatuses["p-3"]).toBe("contacted"); // Other statuses preserved
    expect(nextStatuses["p-4"]).toBe("new");
  });

  it("sanitizes status updates to strictly prevent manually setting status to 'winner'", () => {
    const sanitizeStatuses = (input: Record<string, any>) => {
      const sanitized: Record<string, string> = {};
      for (const [id, st] of Object.entries(input)) {
        if (st === "contacted") {
          sanitized[id] = "contacted";
        } else if (st === "new") {
          sanitized[id] = "new";
        } else if (st !== "winner") {
          sanitized[id] = "new";
        }
      }
      return sanitized;
    };

    const attemptedInput = {
      "user-1": "contacted",
      "user-2": "winner", // Attempted manual winner
      "user-3": "new",
      "user-4": "other_unknown",
    };

    const sanitized = sanitizeStatuses(attemptedInput);

    expect(sanitized["user-1"]).toBe("contacted");
    expect(sanitized["user-2"]).toBeUndefined(); // "winner" rejected
    expect(sanitized["user-3"]).toBe("new");
    expect(sanitized["user-4"]).toBe("new");
  });
});
