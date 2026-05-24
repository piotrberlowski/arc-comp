import type { ParticipantProfileInput } from "@/lib/participantProfileSchema"

export type EditChampionshipCompetitorFormState = {
    data?: Partial<ParticipantProfileInput>
    errors: Record<string, string>
    success?: boolean
}

export const initialEditChampionshipCompetitorFormState: EditChampionshipCompetitorFormState = {
    errors: {},
}
