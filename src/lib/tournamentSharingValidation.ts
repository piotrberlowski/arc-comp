import { prismaOrThrow } from "@/lib/prisma"

export async function validateCheckedInParticipantsHaveScores(
    tournamentId: string,
    errorMessagePrefix: string
): Promise<void> {
    const tournament = await prismaOrThrow("validate checked-in participants have scores").tournament.findUnique({
        where: { id: tournamentId },
        include: {
            participants: {
                where: { checkedIn: true },
                include: { participantScore: true },
            },
        },
    })

    if (!tournament) {
        throw new Error("Tournament not found")
    }

    const incompleteParticipants = tournament.participants.filter((participant) => !participant.participantScore)

    if (incompleteParticipants.length > 0) {
        throw new Error(
            `${errorMessagePrefix}: ${incompleteParticipants.length} participants have incomplete scores`
        )
    }
}

export async function isTournamentResultsComplete(tournamentId: string): Promise<boolean> {
    const tournament = await prismaOrThrow("get tournament results complete").tournament.findUnique({
        where: { id: tournamentId },
        include: {
            participants: {
                where: { checkedIn: true },
                include: { participantScore: true },
            },
        },
    })

    if (!tournament) {
        return false
    }

    return tournament.participants.length > 0 && tournament.participants.every((p) => !!p.participantScore)
}
