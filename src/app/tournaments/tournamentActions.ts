import { RoundFormat, Tournament } from "@prisma/client"

export async function listTournamentsForClubs(clubs: string[]) {
     if (!prisma) {
        console.log("Cannot remove organizer, DB not connected!")
        throw "No DB connection"
    }
    return prisma.tournament.findMany({
        where: {
            organizerClub: {
                in: clubs
            }
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
     if (!prisma) {
        console.log("Cannot remove organizer, DB not connected!")
        throw "No DB connection"
    }
    return prisma.roundFormat.findMany().catch(e => {
        console.log("Failed.to load Round Formats...", e)
    })
}

export async function createTournament(tournament:Tournament) {
         if (!prisma) {
        console.log("Cannot remove organizer, DB not connected!")
        throw "No DB connection"
    }

}