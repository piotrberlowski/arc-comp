"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { addChampionshipDay } from "../championshipActions"
import type { AddChampionshipDayFormState } from "./addChampionshipDayFormState"

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
    if (value === null || value === "") {
        return undefined
    }
    return String(value)
}

const addChampionshipDayFormSchema = z
    .object({
        championshipId: z.string().min(1),
        name: z.string().trim().min(1, "Tournament name cannot be empty"),
        date: z.coerce.date({ invalid_type_error: "Date is required" }),
        usesRangeFormats: z.string().optional(),
        formatId: z.string().optional(),
        endCount: z.coerce.number().int().min(1, "End count must be at least 1").optional(),
        groupSize: z.coerce.number().int().min(2, "Group size must be at least 2").optional(),
    })
    .superRefine((data, ctx) => {
        if (data.usesRangeFormats === "true") {
            return
        }
        if (!data.formatId?.trim()) {
            ctx.addIssue({ code: "custom", path: ["formatId"], message: "Round format must be selected" })
        }
        if (data.endCount === undefined) {
            ctx.addIssue({ code: "custom", path: ["endCount"], message: "End count must be at least 1" })
        }
        if (data.groupSize === undefined) {
            ctx.addIssue({ code: "custom", path: ["groupSize"], message: "Group size must be at least 2" })
        }
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
        date: formData.get("date"),
        usesRangeFormats: emptyToUndefined(formData.get("usesRangeFormats")),
        formatId: emptyToUndefined(formData.get("formatId")),
        endCount: emptyToUndefined(formData.get("endCount")),
        groupSize: emptyToUndefined(formData.get("groupSize")),
    }
}

export async function submitAddChampionshipDayForm(
    _initialState: AddChampionshipDayFormState,
    formData: FormData
): Promise<AddChampionshipDayFormState> {
    const parseResult = addChampionshipDayFormSchema.safeParse(formDataToInput(formData))

    if (!parseResult.success) {
        return {
            errors: normalizeFieldErrors(parseResult.error.flatten().fieldErrors),
            success: false,
        }
    }

    const parsedInput = parseResult.data
    const input = {
        championshipId: parsedInput.championshipId,
        name: parsedInput.name,
        date: parsedInput.date,
        formatId: parsedInput.usesRangeFormats === "true" ? undefined : parsedInput.formatId,
        endCount: parsedInput.usesRangeFormats === "true" ? undefined : parsedInput.endCount,
        groupSize: parsedInput.usesRangeFormats === "true" ? undefined : parsedInput.groupSize,
    }

    try {
        await addChampionshipDay(input)
        revalidatePath(`/championships/${input.championshipId}`)
        return { errors: {}, success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to add championship day"
        return {
            errors: { _form: message },
            success: false,
        }
    }
}
