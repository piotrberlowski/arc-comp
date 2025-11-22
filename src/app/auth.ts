import NextAuth, { NextAuthConfig, Session } from "next-auth"
// eslint-disable-next-line
import { Organizer } from "@/generated/prisma/client"
import prisma, { prismaOrThrow } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { JWT } from "next-auth/jwt"
// eslint-disable-next-line
import { AdapterUser } from "next-auth/adapters"
import { NextRequest } from "next/server"
import authConfig, { LOGIN_PATH } from "./auth.config"

const adapter = PrismaAdapter(prisma)

const handler = NextAuth({
    adapter: adapter,
    session: {
        strategy: "database"
    },
    pages: {
        signIn: LOGIN_PATH
    },
    callbacks: {
        async session(params) {
            const { session, user } = params
            if (user) {
                const userWithRoles = await prismaOrThrow("authenticate user").user.findUnique({ where: { id: user.id }, include: { organizerRoles: true } }).catch(e => {
                    console.error("Failed to fetch user roles:", e)
                    return null
                })
                session.isAdmin = userWithRoles?.isAdmin as boolean | false
                session.organizerRoles = userWithRoles?.organizerRoles as Organizer[] | []
            }
            return session
        },
        async authorized({ request, auth }: { request: NextRequest, auth: Session | null }) {
            const authorized = !!auth
                || request.nextUrl.pathname.startsWith("/api/auth")
                || request.nextUrl.pathname.startsWith(LOGIN_PATH)
            // Logged in users are authenticated, otherwise redirect to login page
            return authorized
        }
    },
    experimental: {
        enableWebAuthn: true,
    },
    debug: process.env.NODE_ENV !== "production" ? true : false,
    ...authConfig,
} satisfies NextAuthConfig
)

declare module "next-auth" {
    interface Session {
        externalAccount?: string
        sub?: string
        isAdmin: boolean
        organizerRoles: Organizer[]
    }
    interface User {
        isAdmin: boolean,
        organizerRoles: Organizer[]
    }

}

declare module "next-auth/adapters" {
    interface AdapterUser {
        isAdmin: boolean
        organizerRoles: Organizer[]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        externalAccount?: string
        internalUser: string
        isAdmin: boolean,
        organizerRoles: Organizer[]
    }
}

export const { handlers, signIn, signOut, auth } = handler