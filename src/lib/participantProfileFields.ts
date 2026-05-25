import type { ParticipantProfileInput } from "@/lib/participantProfileSchema"

export type ParticipantProfileFieldKey = keyof ParticipantProfileInput

export type ParticipantProfileFieldKind = "text" | "ageGroup" | "gender" | "category"

export type ParticipantProfileFieldDefinition = {
    key: ParticipantProfileFieldKey
    label: string
    placeholder?: string
    kind: ParticipantProfileFieldKind
}

export const participantProfileFields: ParticipantProfileFieldDefinition[] = [
    { key: "name", label: "Archer's name", placeholder: "Archer's name", kind: "text" },
    { key: "membershipNo", label: "Membership number", placeholder: "Membership no.", kind: "text" },
    { key: "club", label: "Club", placeholder: "Club", kind: "text" },
    { key: "ageGroupId", label: "Age division", kind: "ageGroup" },
    { key: "genderGroup", label: "Gender", kind: "gender" },
    { key: "categoryId", label: "Equipment category", kind: "category" },
]

export const participantProfileFieldKeys = participantProfileFields.map((field) => field.key)

export const participantProfileFieldGroups: ParticipantProfileFieldKey[][] = [
    ["name", "membershipNo", "club"],
    ["ageGroupId", "genderGroup", "categoryId"],
]

const fieldDefinitionByKey = Object.fromEntries(
    participantProfileFields.map((field) => [field.key, field])
) as Record<ParticipantProfileFieldKey, ParticipantProfileFieldDefinition>

export function getParticipantProfileFieldDefinition(key: ParticipantProfileFieldKey) {
    return fieldDefinitionByKey[key]
}

export function participantDivisionAbbrev({
    ageGroupId,
    genderGroup,
    categoryId,
}: {
    ageGroupId: string
    genderGroup: string
    categoryId: string
}): string {
    return `${ageGroupId}${genderGroup}${categoryId}`
}

export function participantProfileFromFormData(formData: FormData): Record<ParticipantProfileFieldKey, FormDataEntryValue | null> {
    return Object.fromEntries(
        participantProfileFieldKeys.map((key) => [key, formData.get(key)])
    ) as Record<ParticipantProfileFieldKey, FormDataEntryValue | null>
}

export function participantProfileFromParticipant(
    participant: Partial<Record<ParticipantProfileFieldKey, string | null | undefined>> & {
        genderGroup?: ParticipantProfileInput["genderGroup"] | null
    }
): Partial<ParticipantProfileInput> {
    const profile: Partial<ParticipantProfileInput> = {}

    if (participant.name) {
        profile.name = participant.name
    }
    if (participant.membershipNo) {
        profile.membershipNo = participant.membershipNo
    }
    if (participant.club) {
        profile.club = participant.club
    }
    if (participant.ageGroupId) {
        profile.ageGroupId = participant.ageGroupId
    }
    if (participant.categoryId) {
        profile.categoryId = participant.categoryId
    }
    if (participant.genderGroup === "F" || participant.genderGroup === "M") {
        profile.genderGroup = participant.genderGroup
    }

    return profile
}
