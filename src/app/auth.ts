import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { NextAuthConfig } from "next-auth"
// eslint-disable-next-line
import { Organizer } from "@prisma/client"
import { JWT } from "next-auth/jwt"
import prisma from "../../lib/prisma"
// eslint-disable-next-line
import { AdapterUser } from "next-auth/adapters"
import authConfig from "./auth.config"


const LOGIN_PATH = "/login"
const adapter = prisma ? PrismaAdapter(prisma) : undefined

const handler = NextAuth({
    adapter: adapter,
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: LOGIN_PATH
    },
    callbacks: {
        async jwt(params): Promise<JWT> {
            const { token, user, trigger, account, session, profile } = params
            if (trigger === "update") token.name = session.user.name
            if (profile?.sub) {
                token.sub = profile.sub
            }
            if (account?.providerAccountId) {
                token.externalAccount = account.providerAccountId
            }
            if (user) {
                token.isAdmin = user.isAdmin
                const userWithRoles = await prisma.user.findUnique({ where: { id: user.id }, include: { organizerRoles: true } }).catch(e => console.log(e))
                token.organizerRoles = userWithRoles?.organizerRoles || []
            }
            return token
        },
        async session(params) {
            const { session, token, } = params
            if (token?.sub) {
                session.sub = token.sub
            }
            if (token) {
                session.externalAccount = token.externalAccount as string | undefined
                session.isAdmin = token.isAdmin as boolean
                session.organizerRoles = token.organizerRoles as Organizer[]
            }
            return session
        },
        async authorized(params) {
            const { request, auth } = params
            const authorized = !!auth?.externalAccount
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