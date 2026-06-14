import { describe, it, expect } from "vitest";
import { INTERVIEW_PASS_THRESHOLD, isPassingScore, skillSlug, skillDisplayName } from "../interviewScoring";

describe("interview pass gate (controls badge issuance)", () => {
    it("passes exactly at the threshold", () => {
        expect(isPassingScore(INTERVIEW_PASS_THRESHOLD, false)).toBe(true);
    });
    it("fails one point below the threshold", () => {
        expect(isPassingScore(INTERVIEW_PASS_THRESHOLD - 1, false)).toBe(false);
    });
    it("never passes when the session was flagged as cheated, even with a perfect score", () => {
        expect(isPassingScore(100, true)).toBe(false);
    });
    it("passes a clean perfect score", () => {
        expect(isPassingScore(100, false)).toBe(true);
    });
});

describe("skill slug / display normalization (badge de-dup key)", () => {
    it("slugs a multi-word role consistently", () => {
        expect(skillSlug("Prompt Engineering")).toBe("prompt-engineering");
        expect(skillSlug("  React.js  Frontend ")).toBe("react-js-frontend");
    });
    it("falls back to 'general' for empty input", () => {
        expect(skillSlug("")).toBe("general");
        expect(skillSlug("   ")).toBe("general");
    });
    it("display name is upper-cased and trimmed", () => {
        expect(skillDisplayName("react")).toBe("REACT");
        expect(skillDisplayName("")).toBe("GENERAL");
    });
});
