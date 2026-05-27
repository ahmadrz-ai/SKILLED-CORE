"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const legalLinks = [
    { href: "/legal/user-agreement", label: "User Agreement" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/legal/privacy-policy", label: "Privacy Policy" },
    { href: "/legal/professional-community-policies", label: "Professional Community Policies" },
    { href: "/legal/cookie-policy", label: "Cookie Policy" },
    { href: "/legal/copyright-policy", label: "Copyright Policy" },
];

export function LegalSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
            <div className="sticky top-24">
                <nav className="space-y-1">
                    {legalLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "block px-4 py-2 text-sm font-medium rounded-lg transition-colors border",
                                pathname === link.href
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-100 font-semibold"
                                    : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="mt-8 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                        Legal Resources
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-500 font-medium">
                        <li><Link href="/help" className="hover:text-indigo-600 transition-colors">Help Center</Link></li>
                        <li><Link href="/accessibility" className="hover:text-indigo-600 transition-colors">Accessibility</Link></li>
                    </ul>
                </div>
            </div>
        </aside>
    );
}
