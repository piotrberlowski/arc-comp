"use server"

import { normalizeFieldErrors } from "@/lib/normalizeFieldErrors"
import { participantProfileFromFormData } from "@/lib/participantProfileFields"
import { participantProfileSchema } from "@/lib/participantProfileSchema"
import { z } from "zod"
import { zu } from "zod_utilz"
import { updateChampionshipRegistration } from "../championshipActions"
import type { EditChampionshipCompetitorFormState } from "./editChampionshipCompetitorFormState"

const editChampionshipCompetitorFormSchema = participantProfileSchema.extend({
    championshipId: z.string().min(1),
    registrationId: z.string().min(1),
})

function formDataToInput(formData: FormData) {
    return {
        championshipId: formData.get("championshipId"),
        registrationId: formData.get("registrationId"),
        ...participantProfileFromFormData(formData),
    }
}

export async function submitEditChampionshipCompetitorForm(
    _initialState: EditChampionshipCompetitorFormState,
    formData: FormData
): Promise<EditChampionshipCompetitorFormState> {
    const formInput = formDataToInput(formData)
    const parsed = zu.partialSafeParse(editChampionshipCompetitorFormSchema, formInput)

    if (!parsed.success || parsed.successType !== "full") {
        return {
            data: parsed.validData,
            errors: normalizeFieldErrors(parsed.error?.flatten().fieldErrors),
            success: false,
        }
    }

    const input = editChampionshipCompetitorFormSchema.parse(formInput)

    try {
        await updateChampionshipRegistration(input.championshipId, input.registrationId, input)
        return { errors: {}, success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update competitor"
        return {
            data: input,
            errors: { _form: message },
            success: false,
        }
    }
}
