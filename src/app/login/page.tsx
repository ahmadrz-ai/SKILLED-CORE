import LoginPageContent from "@/components/auth/LoginPageContent";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const session = await auth();
    if (session?.user) {
        redirect("/onboarding");
    }

    return <LoginPageContent />;
}
