/**
 * Exact-hostname allow check.
 *
 * Use this instead of `url.includes("somehost.com")`, which is bypassable
 * (e.g. "https://evil.com/res.cloudinary.com" passes a substring check) and is
 * flagged by CodeQL as js/incomplete-url-substring-sanitization. We parse the URL
 * and compare the real hostname, matching the host exactly or as a subdomain.
 */
export function urlHostMatches(raw: string, allowed: string[]): boolean {
    let host: string;
    try {
        host = new URL(raw).hostname.toLowerCase();
    } catch {
        return false;
    }
    return allowed.some((a) => host === a || host.endsWith("." + a));
}
