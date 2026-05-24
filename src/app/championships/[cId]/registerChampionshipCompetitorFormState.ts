import type { ParticipantProfileInput } from "@/lib/participantProfileSchema"

export type RegisterChampionshipCompetitorFormState = {
    data?: Partial<ParticipantProfileInput>
    errors: Record<string, string>
    success?: boolean
}

export const initialRegisterChampionshipCompetitorFormState: RegisterChampionshipCompetitorFormState = {
    errors: {},
}
