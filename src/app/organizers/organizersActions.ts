"use server"

import { Organizer } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function removeOrganizer(role: Organizer, revalidate?: string) {
    if (!prisma) {
        console.log("Cannot remove organizer, DB not connected!")
        throw "No DB connection"
    }
    return await prisma.organizer.delete(
        {
            where: {
                userId_club: role,
            },
        },
    ).then(
        () => revalidate && revalidatePath(revalidate)
    )
}

export async function createOrganizer(formData: FormData) {
    if (!prisma) {
        console.log("Cannot remove organizer, DB not connected!")
        throw "No DB connection"
    }
    const userId = formData.get("userId")?.toString()
    const club = formData.get("club")?.toString()
    if (!userId || !club) {
        return "Please specify both userId and club!"
    }

    return await prisma.organizer.create({
        data: {
            userId: userId,
            club: club,
        }
    }).then(
        () => {
            const revalidate = formData.get("revalidate")?.toString()
            if (revalidate) {
                revalidatePath(revalidate)
            }
            return undefined
        }
    ).catch(
        e => e
    )
}

export async function listUsers() {
    if (!prisma) {
        console.log("Cannot remove organizer, DB not connected!")
        throw "No DB connection"
    }
    return await prisma.user.findMany({
        select: {
            id: true,
            name: true,
        },
        where: {
            name: {
                not: null
            }
        }
    })   
}