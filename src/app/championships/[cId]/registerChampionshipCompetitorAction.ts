"use server"

import { normalizeFieldErrors } from "@/lib/normalizeFieldErrors"
import { participantProfileSchema } from "@/lib/participantProfileSchema"
import { z } from "zod"
import { zu } from "zod_utilz"
import { registerChampionshipParticipant } from "../championshipActions"
import type { RegisterChampionshipCompetitorFormState } from "./registerChampionshipCompetitorFormState"

const registerChampionshipCompetitorFormSchema = participantProfileSchema.extend({
    championshipId: z.string().min(1),
})

function formDataToInput(formData: FormData) {
    return {
        championshipId: formData.get("championshipId"),
        name: formData.get("name"),
        membershipNo: formData.get("membershipNo"),
        club: formData.get("club"),
        ageGroupId: formData.get("ageGroupId"),
        genderGroup: formData.get("genderGroup"),
        categoryId: formData.get("categoryId"),
    }
}

export async function submitRegisterChampionshipCompetitorForm(
    _initialState: RegisterChampionshipCompetitorFormState,
    formData: FormData
): Promise<RegisterChampionshipCompetitorFormState> {
    const formInput = formDataToInput(formData)
    const parsed = zu.partialSafeParse(registerChampionshipCompetitorFormSchema, formInput)

    if (!parsed.success || parsed.successType !== "full") {
        return {
            data: parsed.validData,
            errors: normalizeFieldErrors(parsed.error?.flatten().fieldErrors),
            success: false,
        }
    }

    const input = registerChampionshipCompetitorFormSchema.parse(formInput)

    try {
        await registerChampionshipParticipant(input)
        return { errors: {}, success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to register competitor"
        return {
            data: input,
            errors: { _form: message },
            success: false,
        }
    }
}
