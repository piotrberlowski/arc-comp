"use server"
import { signIn, signOut } from "@/app/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export async function providerLogIn(
    providerId: string,
    callbackUrl?: string,
    errorUrl?: string,
) {
    try {
        await signIn(providerId, {
            redirectTo: callbackUrl ?? "",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return redirect(`${errorUrl}?error=${error.type}`)
        }
        throw error
    }
}

export async function logIn() {
    await signIn()
}

export async function logOut() {
    await signOut()
}