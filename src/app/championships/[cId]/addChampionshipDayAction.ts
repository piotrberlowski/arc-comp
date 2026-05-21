"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { zu } from "zod_utilz"
import { addChampionshipDay } from "../championshipActions"
import type { AddChampionshipDayFormState } from "./addChampionshipDayFormState"

const addChampionshipDayFormSchema = z.object({
    championshipId: z.string().min(1),
    name: z.string().trim().min(1, "Tournament name cannot be empty"),
    formatId: z.string().min(1, "Round format must be selected"),
    date: z.coerce.date({ invalid_type_error: "Date is required" }),
    endCount: z.coerce.number().int().min(1, "End count must be at least 1"),
    groupSize: z.coerce.number().int().min(2, "Group size must be at least 2"),
})

function normalizeFieldErrors(
    fieldErrors: Record<string, string[] | undefined> | undefined
): Record<string, string> {
    if (!fieldErrors) {
        return {}
    }

    return Object.fromEntries(
        Object.entries(fieldErrors)
            .filter((entry): entry is [string, string[]] => !!entry[1]?.length)
            .map(([field, messages]) => [field, messages[0]])
    )
}

function formDataToInput(formData: FormData) {
    return {
        championshipId: formData.get("championshipId"),
        name: formData.get("name"),
        formatId: formData.get("formatId"),
        date: formData.get("date"),
        endCount: formData.get("endCount"),
        groupSize: formData.get("groupSize"),
    }
}

export async function submitAddChampionshipDayForm(
    _initialState: AddChampionshipDayFormState,
    formData: FormData
): Promise<AddChampionshipDayFormState> {
    const formInput = formDataToInput(formData)
    const parsed = zu.partialSafeParse(addChampionshipDayFormSchema, formInput)

    if (!parsed.success || parsed.successType !== "full") {
        return {
            data: parsed.validData,
            errors: normalizeFieldErrors(parsed.error?.flatten().fieldErrors),
            success: false,
        }
    }

    const input = addChampionshipDayFormSchema.parse(formInput)

    try {
        await addChampionshipDay(input)
        revalidatePath(`/championships/${input.championshipId}`)
        return { errors: {}, success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to add championship day"
        return {
            data: input,
            errors: { _form: message },
            success: false,
        }
    }
}
