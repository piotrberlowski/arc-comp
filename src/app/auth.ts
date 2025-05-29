import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { NextAuthConfig } from "next-auth"
// eslint-disable-next-line
import { JWT } from "next-auth/jwt"
import Auth0 from "next-auth/providers/auth0"
import Discord from "next-auth/providers/discord"
import Google from "next-auth/providers/google"
import prisma from "../../lib/prisma"
import { Provider } from "next-auth/providers"
import { Organizer } from "@prisma/client"
// eslint-disable-next-line
import { AdapterUser } from "next-auth/adapters"


const LOGIN_PATH = "/login"
const adapter = (prisma) ? PrismaAdapter(prisma) : undefined

const providers: Provider[] =
    [
        Auth0({
            clientId: process.env.AUTH_AUTH0_ID,
            clientSecret: process.env.AUTH_AUTH0_SECRET,
            issuer: process.env.AUTH_AUTH0_ISSUER,
            redirectProxyUrl: process.env.AUTH_AUTH0_BASE_URL,
        }),
        Google({
            allowDangerousEmailAccountLinking: true,
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET
        }),
        Discord,
    ]

const handler = NextAuth({
    adapter: adapter,
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: LOGIN_PATH
    },
    providers: providers,
    callbacks: {
        async jwt(params) {
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
                const userWithRoles = await prisma.user.findUnique({where: {id:user.id}, include:{organizerRoles:true}}).catch(e => console.log(e))
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
                session.externalAccount = token.externalAccount
                session.isAdmin = token.isAdmin
                session.organizerRoles = token.organizerRoles
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
} satisfies NextAuthConfig,
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

export const providerMap = providers
    .map((provider) => {
        if (typeof provider === "function") {
            const providerData = provider()
            return { id: providerData.id, name: providerData.name }
        } else {
            return { id: provider.id, name: provider.name }
        }
    })
    .filter((provider) => provider.id !== "credentials")

export const { handlers, signIn, signOut, auth } = handler