"use server"

import { Prisma } from "@/generated/prisma/client"
import { prismaOrThrow } from "@/lib/prisma"

export interface TournamentUpdate {
    name?: string,
    date?: Date,
}

export async function listTournamentsForClubs(clubs: string[], includeArchive: boolean) {
    const isArchive: boolean | Prisma.BoolFilter<"Tournament"> | undefined = (includeArchive) ? undefined : false
    return prismaOrThrow("list tournaments").tournament.findMany({
        where: {
            organizerClub: {
                in: clubs
            },
            isArchive: isArchive
        },
        include: {
            format: true
        },
        orderBy: {
            date: "desc"
        }
    })
}

export async function listRoundFormats() {
    return prismaOrThrow("list round formats").roundFormat.findMany().catch(e => {
        console.error("Failed to load Round Formats:", e)
        return null
    })
}

export async function createTournament(name: string, formatId: string, club: string, date: Date, endCount: number, groupSize: number) {
    return await prismaOrThrow("create tournament").tournament.create(
        {
            data: {
                name: name,
                organizerClub: club,
                formatId: formatId,
                date: date,
                endCount: endCount,
                groupSize: groupSize
            }
        }
    ).then(
        t => t.id
    )

}

export async function archiveTournament(id: string) {
    return await prismaOrThrow("archive tournament").tournament.update(
        {
            where: {
                id: id,
            },
            data: {
                isArchive: true
            },
            include: {
                format: true
            }
        }
    )
}

export async function getTournamentById(id: string) {
    return await prismaOrThrow("get tournament by id").tournament.findFirstOrThrow(
        {
            where: {
                id: id,
            }
        }
    )
}

export async function updateTournament(id: string, u: TournamentUpdate) {
    return await prismaOrThrow("update tournament").tournament.update({
        where: {
            id: id,
        },
        data: u,
    })
}

