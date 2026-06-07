import { AppContentSkeleton } from "@/components/skeletons";

// Generic in-shell fallback for app pages without a more specific loading.tsx.
export default function Loading() {
    return <AppContentSkeleton />;
}
