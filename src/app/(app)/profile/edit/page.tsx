import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileEditor from "@/components/profile/ProfileEditor";

export default async function ResumeEditorPage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/login');
    }

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                experience: true,
                // @ts-ignore: Schema might be ahead of client due to file lock
                education: true
            }
        });
    } catch (error) {
        console.warn("DB Fetch Error. Using Offline Mode.", error);
        user = {
            id: session.user.id,
            name: session.user.name,
            headline: "Database Unreachable",
            bio: "Please restart server to sync database.",
            skills: "",
            experience: [],
            education: []
        };
    }

    if (!user) redirect('/login');

    return (
        <ProfileEditor user={user} isOwner={true} />
    );
}
