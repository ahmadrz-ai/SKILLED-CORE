/**
 * Per-page structured skeletons. Each route's loading.tsx renders the matching one so
 * the loading state mirrors the page that's actually coming (not a generic feed shell).
 * Pure presentational (no hooks) so they work as server components inside loading.tsx.
 */
import { cn } from "@/lib/utils";

function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-sc-gray-150", className)} />;
}

function Card({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border-default bg-bg-card p-5", className)}>{children}</div>;
}

/* Neutral, brand-agnostic centered loader — root fallback for routes without their own. */
export function NeutralLoader() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-page">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-sc-purple-100 animate-pulse" />
        <Block className="h-3 w-28" />
      </div>
    </div>
  );
}

/* Auth (login/register) — centered card. */
export function AuthSkeleton() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-sc-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Block className="h-9 w-9 rounded-lg" />
          <Block className="h-5 w-28" />
        </div>
        <Card className="p-8">
          <div className="flex flex-col items-center gap-2 mb-7">
            <Block className="h-6 w-40" />
            <Block className="h-3 w-56" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Block className="h-10" />
            <Block className="h-10" />
          </div>
          <Block className="h-px w-full mb-6" />
          <div className="space-y-4">
            <Block className="h-10" />
            <Block className="h-10" />
            <Block className="h-10 mt-2" />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* Generic in-shell content skeleton (fallback for app pages). */
export function AppContentSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="space-y-2">
        <Block className="h-7 w-56" />
        <Block className="h-3 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="space-y-3">
            <Block className="h-10 w-10 rounded-full" />
            <Block className="h-4 w-32" />
            <Block className="h-3 w-24" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* Feed — composer + post cards + right rail. */
export function FeedSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4 max-w-2xl w-full mx-auto">
        <Card className="flex items-center gap-3">
          <Block className="h-10 w-10 rounded-full" />
          <Block className="h-10 flex-1 rounded-full" />
        </Card>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3 mb-4">
              <Block className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Block className="h-4 w-36" />
                <Block className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <Block className="h-3.5 w-full" />
              <Block className="h-3.5 w-4/5" />
              <Block className="h-3.5 w-3/5" />
            </div>
            <div className="flex gap-2 pt-3 border-t border-border-subtle">
              {Array.from({ length: 4 }).map((_, j) => <Block key={j} className="h-7 w-16 rounded-full" />)}
            </div>
          </Card>
        ))}
      </div>
      <div className="hidden lg:block space-y-4">
        <Card className="space-y-3">
          <Block className="h-4 w-28" />
          {Array.from({ length: 3 }).map((_, i) => <Block key={i} className="h-3 w-full" />)}
        </Card>
        <Card className="space-y-3">
          <Block className="h-4 w-32" />
          {Array.from({ length: 2 }).map((_, i) => <Block key={i} className="h-10 w-full" />)}
        </Card>
      </div>
    </div>
  );
}

/* Interview — full-screen dark assessment shell. */
export function InterviewSkeleton() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-44 rounded-md bg-zinc-800 animate-pulse" />
          <div className="h-8 w-24 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-800 animate-pulse" />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 space-y-4">
          <div className="h-5 w-3/4 rounded bg-zinc-800 animate-pulse" />
          <div className="h-4 w-full rounded bg-zinc-800/70 animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-zinc-800/70 animate-pulse" />
          <div className="h-32 w-full rounded-xl bg-zinc-800/50 animate-pulse mt-6" />
        </div>
        <div className="flex justify-end gap-3">
          <div className="h-10 w-28 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="h-10 w-28 rounded-lg bg-sc-purple-900 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* Hire — search bar + ranked result rows. */
export function HireSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <Block className="h-7 w-64" />
      <Block className="h-12 w-full rounded-xl" />
      {Array.from({ length: 3 }).map((_, r) => (
        <div key={r} className="space-y-3">
          <Block className="h-4 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Block className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2"><Block className="h-4 w-28" /><Block className="h-3 w-20" /></div>
                </div>
                <Block className="h-8 w-full rounded-lg" />
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Network — left manage rail + connection cards. */
export function NetworkSkeleton() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="w-full md:w-64 border-r border-border-sidebar p-6 space-y-3">
        <Block className="h-3 w-28 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => <Block key={i} className="h-9 w-full rounded-lg" />)}
      </div>
      <div className="flex-1 p-6 md:p-10 space-y-6">
        <Block className="h-8 w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex items-center gap-4">
            <Block className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2"><Block className="h-4 w-40" /><Block className="h-3 w-28" /></div>
            <Block className="h-8 w-24 rounded-lg" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* Notifications — sticky filter panel + list rows. */
export function NotificationsSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
      <Block className="h-7 w-48" />
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <Card className="w-full lg:w-72 flex-shrink-0 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Block key={i} className="h-9 w-full rounded-lg" />)}
        </Card>
        <div className="flex-1 w-full space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex gap-4">
              <Block className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2"><Block className="h-4 w-3/4" /><Block className="h-3 w-24" /></div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Jobs / generic list */
export function ListSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
      <Block className="h-7 w-48 mb-2" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="space-y-3">
          <Block className="h-5 w-1/2" />
          <Block className="h-3 w-1/3" />
          <div className="flex gap-2">{Array.from({ length: 3 }).map((_, j) => <Block key={j} className="h-6 w-16 rounded-full" />)}</div>
        </Card>
      ))}
    </div>
  );
}
