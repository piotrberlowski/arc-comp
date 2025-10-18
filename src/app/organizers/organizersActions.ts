"use server"

import { Organizer } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { prismaOrThrow } from "../../../lib/prisma"

export async function removeOrganizer(role: Organizer, revalidate?: string) {
    return await prismaOrThrow("remove organizer").organizer.delete(
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
    const userId = formData.get("userId")?.toString()
    const club = formData.get("club")?.toString()
    if (!userId || !club) {
        return "Please specify both userId and club!"
    }

    return await prismaOrThrow("create organizer").organizer.create({
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
    return await prismaOrThrow("list users").user.findMany({
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

export async function listOrganizers() {
    return prismaOrThrow("list organizers").user.findMany({
        where: {
            organizerRoles: {
                some: {}
            },
        },
        include: {
            organizerRoles: true,
        },
    }).then(
        organizers => { return { organizers: organizers, error: null } }
    ).catch(
        e => { return { organizers: [], error: e } }
    )
}