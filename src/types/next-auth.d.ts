import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string
            plan: string
            username: string | null
            isVerified: boolean
            twoFactorEnabled: boolean
            twoFactorPending: boolean
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        role: string
        plan: string
        username: string | null
        isVerified: boolean
        twoFactorEnabled: boolean
        twoFactorPending?: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: string
        plan: string
        username: string | null
        isVerified: boolean
        twoFactorEnabled: boolean
        twoFactorPending?: boolean
    }
}
