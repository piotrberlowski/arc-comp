import { formatIfafScoreFromResult } from "@/lib/championshipCombinedIfafScores"
import type { TournamentResultsData } from "../../resultsActions"
import type { IfafExportData, IfafExportParticipant } from "./ifafExportTypes"

function mapTournamentParticipant(
    participant: TournamentResultsData["participants"][number]
): IfafExportParticipant {
    return {
        name: participant.name,
        membershipNo: participant.membershipNo || "",
        club: participant.club || "Independent",
        ageGroupId: participant.ageGroupId,
        categoryId: participant.category.id,
        genderGroup: participant.genderGroup,
        scoreColumns: [formatIfafScoreFromResult(participant.result)],
    }
}

export function ifafExportDataFromTournament(tournamentData: TournamentResultsData): IfafExportData {
    return {
        organizerClub: tournamentData.tournament.organizerClub,
        roundLabel: tournamentData.tournament.format.name,
        participantCount: tournamentData.participants.length,
        dateStart: tournamentData.tournament.date,
        dateEnd: tournamentData.tournament.date,
        participants: tournamentData.participants.map(mapTournamentParticipant),
    }
}
