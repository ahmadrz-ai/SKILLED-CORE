import { NeutralLoader } from "@/components/skeletons";

// Root fallback for any route without its own loading.tsx — neutral, not feed-shaped.
export default function Loading() {
    return <NeutralLoader />;
}
