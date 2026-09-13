"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { addChampionshipShootoffDay } from "../championshipActions"
import {
    normalizeChampionshipFormFieldErrors,
    type AddChampionshipDayFormState,
} from "./addChampionshipDayFormState"

const addChampionshipShootoffFormSchema = z.object({
    championshipId: z.string().min(1),
    date: z.coerce.date({ invalid_type_error: "Date is required" }),
    formatId: z.string().trim().min(1, "Round format must be selected"),
    endCount: z.coerce.number().int().min(1, "End count must be at least 1"),
    groupSize: z.coerce.number().int().min(2, "Group size must be at least 2"),
})

export async function submitAddChampionshipShootoffForm(
    _initialState: AddChampionshipDayFormState,
    formData: FormData
): Promise<AddChampionshipDayFormState> {
    const parseResult = addChampionshipShootoffFormSchema.safeParse({
        championshipId: formData.get("championshipId"),
        date: formData.get("date"),
        formatId: formData.get("formatId"),
        endCount: formData.get("endCount"),
        groupSize: formData.get("groupSize"),
    })

    if (!parseResult.success) {
        return {
            errors: normalizeChampionshipFormFieldErrors(parseResult.error.flatten().fieldErrors),
            success: false,
        }
    }

    try {
        await addChampionshipShootoffDay(parseResult.data)
        revalidatePath(`/championships/${parseResult.data.championshipId}`)
        return { errors: {}, success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to add championship shootoff"
        return {
            errors: { _form: message },
            success: false,
        }
    }
}
