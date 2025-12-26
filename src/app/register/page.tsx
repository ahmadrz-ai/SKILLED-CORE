import RegisterPageContent from "@/components/auth/RegisterPageContent";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
    const session = await auth();
    if (session?.user) {
        redirect("/onboarding");
    }

    return <RegisterPageContent />;
}
