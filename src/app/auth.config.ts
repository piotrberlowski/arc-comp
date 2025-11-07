import type { NextAuthConfig } from "next-auth"
import { Provider } from "next-auth/providers"
import Auth0 from "next-auth/providers/auth0"
import Discord from "next-auth/providers/discord"
import Google from "next-auth/providers/google"

export const LOGIN_PATH = "/login"

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

// Notice this is only an object, not a full Auth.js instance
export default {
    providers: providers,
} satisfies NextAuthConfig

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