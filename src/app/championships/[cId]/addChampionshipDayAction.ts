"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { addChampionshipDay } from "../championshipActions"
import {
    normalizeChampionshipFormFieldErrors,
    type AddChampionshipDayFormState,
} from "./addChampionshipDayFormState"

function refineStoredRangeDay(
    data: { rangeLayouts?: unknown[] },
    ctx: z.RefinementCtx
) {
    if (!data.rangeLayouts?.length) {
        ctx.addIssue({ code: "custom", path: ["endCount"], message: "End count must be at least 1" })
    }
}

function refineLegacyDay(
    data: { formatId?: string; endCount?: number; groupSize?: number },
    ctx: z.RefinementCtx
) {
    if (!data.formatId?.trim()) {
        ctx.addIssue({ code: "custom", path: ["formatId"], message: "Round format must be selected" })
    }
    if (data.endCount === undefined) {
        ctx.addIssue({ code: "custom", path: ["endCount"], message: "End count must be at least 1" })
    }
    if (data.groupSize === undefined) {
        ctx.addIssue({ code: "custom", path: ["groupSize"], message: "Group size must be at least 2" })
    }
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
    if (value === null || value === "") {
        return undefined
    }
    return String(value)
}

const rangeLayoutSchema = z.object({
    rangeNumber: z.coerce.number().int(),
    endCount: z.coerce.number().int().min(1, "End count must be at least 1"),
    groupSize: z.coerce.number().int().min(2, "Group size must be at least 2"),
})

const addChampionshipDayFormSchema = z
    .object({
        championshipId: z.string().min(1),
        name: z.string().trim().min(1, "Tournament name cannot be empty"),
        date: z.coerce.date({ invalid_type_error: "Date is required" }),
        usesRangeFormats: z.string().optional(),
        formatId: z.string().optional(),
        endCount: z.coerce.number().int().min(1, "End count must be at least 1").optional(),
        groupSize: z.coerce.number().int().min(2, "Group size must be at least 2").optional(),
        rangeLayouts: z.array(rangeLayoutSchema).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.usesRangeFormats === "true") {
            refineStoredRangeDay(data, ctx)
            return
        }
        refineLegacyDay(data, ctx)
    })

function readRangeLayouts(formData: FormData) {
    return formData.getAll("rangeNumber").map((value) => {
        const rangeNumber = String(value)
        return {
            rangeNumber,
            endCount: formData.get(`endCount-${rangeNumber}`),
            groupSize: formData.get(`groupSize-${rangeNumber}`),
        }
    })
}

function championshipDayInput(parsedInput: {
    championshipId: string
    name: string
    date: Date
    usesRangeFormats?: string
    formatId?: string
    endCount?: number
    groupSize?: number
    rangeLayouts?: { rangeNumber: number; endCount: number; groupSize: number }[]
}) {
    if (parsedInput.usesRangeFormats === "true") {
        return {
            championshipId: parsedInput.championshipId,
            name: parsedInput.name,
            date: parsedInput.date,
            ranges: parsedInput.rangeLayouts,
        }
    }
    return {
        championshipId: parsedInput.championshipId,
        name: parsedInput.name,
        date: parsedInput.date,
        formatId: parsedInput.formatId,
        endCount: parsedInput.endCount,
        groupSize: parsedInput.groupSize,
    }
}

function formDataToInput(formData: FormData) {
    const usesRangeFormats = emptyToUndefined(formData.get("usesRangeFormats"))
    return {
        championshipId: formData.get("championshipId"),
        name: formData.get("name"),
        date: formData.get("date"),
        usesRangeFormats,
        formatId: emptyToUndefined(formData.get("formatId")),
        endCount: emptyToUndefined(formData.get("endCount")),
        groupSize: emptyToUndefined(formData.get("groupSize")),
        rangeLayouts: usesRangeFormats === "true" ? readRangeLayouts(formData) : undefined,
    }
}

export async function submitAddChampionshipDayForm(
    _initialState: AddChampionshipDayFormState,
    formData: FormData
): Promise<AddChampionshipDayFormState> {
    const parseResult = addChampionshipDayFormSchema.safeParse(formDataToInput(formData))

    if (!parseResult.success) {
        return {
            errors: normalizeChampionshipFormFieldErrors(parseResult.error.flatten().fieldErrors),
            success: false,
        }
    }

    const parsedInput = parseResult.data

    try {
        await addChampionshipDay(championshipDayInput(parsedInput))
        revalidatePath(`/championships/${parsedInput.championshipId}`)
        return { errors: {}, success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to add championship day"
        return {
            errors: { _form: message },
            success: false,
        }
    }
}
