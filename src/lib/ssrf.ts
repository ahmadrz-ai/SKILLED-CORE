import "server-only";

/**
 * SSRF guard for server-side fetches of user-supplied URLs. Rejects anything
 * that isn't a public http(s) URL — non-http schemes, localhost, and private /
 * loopback / link-local / cloud-metadata IP ranges (e.g. 169.254.169.254).
 * Throws on a disallowed URL; returns the parsed URL otherwise.
 *
 * NOTE: also fetch with `redirect: "error"` at the call site so a 30x to an
 * internal host can't bypass this check.
 */
export function assertSafeRemoteUrl(raw: string): URL {
    let u: URL;
    try {
        u = new URL(raw);
    } catch {
        throw new Error("Invalid URL");
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
        throw new Error("Only http(s) URLs are allowed");
    }
    const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets

    if (
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.endsWith(".local") ||
        host.endsWith(".internal")
    ) {
        throw new Error("Disallowed host");
    }
    if (isPrivateIp(host)) {
        throw new Error("Disallowed host (private/internal address)");
    }
    return u;
}

function isPrivateIp(host: string): boolean {
    // IPv4
    const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (v4) {
        const [a, b] = [Number(v4[1]), Number(v4[2])];
        if ([a, Number(v4[3]), Number(v4[4])].some((n) => n > 255)) return true; // malformed → block
        if (a === 10) return true;                         // 10.0.0.0/8
        if (a === 127) return true;                        // loopback
        if (a === 0) return true;                          // 0.0.0.0/8
        if (a === 169 && b === 254) return true;           // link-local incl. 169.254.169.254 metadata
        if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12
        if (a === 192 && b === 168) return true;           // 192.168.0.0/16
        if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
        return false;
    }
    // IPv6
    if (host.includes(":")) {
        if (host === "::1" || host === "::") return true;          // loopback / unspecified
        if (host.startsWith("fe80") || host.startsWith("fc") || host.startsWith("fd")) return true; // link-local / ULA
        if (host.startsWith("::ffff:")) return isPrivateIp(host.slice(7)); // IPv4-mapped
        return false;
    }
    return false;
}
