import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LiveInterview from "./LiveInterview";

export const metadata = {
    title: "Live Video Interview | SkilledCore",
    description: "Face-to-face live AI interview with voice and vision.",
};

export const dynamic = "force-dynamic";

export default async function LiveInterviewPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/register?role=candidate&redirect=/interview/live");
    }
    return <LiveInterview />;
}
