import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize user-authored rich HTML (posts, notification messages) before it is
 * injected via dangerouslySetInnerHTML. Strips <script>, event handlers (on*),
 * javascript:/data: URIs and other XSS vectors while preserving the formatting
 * the rich composer produces (bold/italic/links/lists/code/blockquote, inline
 * style colors). Runs on both server (SSR) and client via isomorphic-dompurify,
 * so output is identical in both → no hydration mismatch, and SSR'd HTML is
 * already safe (a client-only sanitize would still ship the raw payload in the
 * initial server response).
 */
export function sanitizeRichHtml(html: string | null | undefined): string {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        // Anchors keep href/target; force-safe rel is added by the hook below.
        ADD_ATTR: ["target"],
        FORBID_TAGS: ["style", "form", "input", "button", "iframe", "object", "embed"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    });
}

// Any anchor that opens a new tab must not leak window.opener to the target.
if (typeof (DOMPurify as any).addHook === "function") {
    DOMPurify.addHook("afterSanitizeAttributes", (node: any) => {
        if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
            node.setAttribute("rel", "noopener noreferrer");
        }
    });
}
