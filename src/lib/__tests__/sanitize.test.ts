import { describe, it, expect } from "vitest";
import { sanitizeRichHtml } from "../sanitize";

describe("sanitizeRichHtml (stored-XSS defense)", () => {
    it("removes <script> blocks entirely", () => {
        const out = sanitizeRichHtml('hello <script>alert(1)</script> world');
        expect(out.toLowerCase()).not.toContain("<script");
        expect(out.toLowerCase()).not.toContain("alert(1)");
        expect(out).toContain("hello");
        expect(out).toContain("world");
    });

    it("strips inline event handlers", () => {
        const out = sanitizeRichHtml('<img src=x onerror="alert(1)">');
        expect(out.toLowerCase()).not.toContain("onerror");
        expect(out.toLowerCase()).not.toContain("alert(1)");
    });

    it("neutralizes javascript: URIs in links", () => {
        const out = sanitizeRichHtml('<a href="javascript:alert(1)">x</a>');
        expect(out.toLowerCase()).not.toContain("javascript:");
    });

    it("keeps benign formatting and text", () => {
        const out = sanitizeRichHtml("<strong>Bold</strong> and <em>italic</em>");
        expect(out).toContain("Bold");
        expect(out).toContain("italic");
    });

    it("is safe on empty / non-string-ish input", () => {
        expect(() => sanitizeRichHtml("")).not.toThrow();
        expect(sanitizeRichHtml("")).toBe("");
    });
});
