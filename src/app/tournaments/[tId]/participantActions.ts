"use server"

import { revalidatePath } from "next/cache"
import { redirect, RedirectType } from "next/navigation"
import { z } from "zod"
import { zu } from 'zod_utilz'
import { prismaOrThrow } from "../../../../lib/prisma"

const participantSubmitSchema = z.object({
    tournamentId: z.string().nonempty(),
    name: z.string().min(3, "Name must be at least 3 characters long"),
    membershipNo: z.string().nonempty("Membership number is required"),
    genderGroup: z.union([
        z.literal("F"),
        z.literal("M"),
    ]),
    ageGroupId: z.string().nonempty("Age Division must be selected"),
    categoryId: z.string().nonempty("Equipment Category must be selected"),
    club: z.string(),
})

export interface AddParticipantState {

    data?: {
        name?: string
        membershipNo?: string
        genderGroup?: "F" | "M"
        ageGroupId?: string
        categoryId?: string
        club?: string
    }
    errors: any

}

export async function addParticipant(initialState: AddParticipantState, fd: FormData): Promise<AddParticipantState> {

    const fdConstructed = {
        tournamentId: fd.get('tId'),
        name: fd.get('name'),
        membershipNo: fd.get('membershipNo'),
        genderGroup: fd.get('genderGroup'),
        ageGroupId: fd.get('ageGroupId'),
        categoryId: fd.get('categoryId'),
        club: fd.get('club')
    }

    const participant = zu.partialSafeParse(participantSubmitSchema, fdConstructed)

    if (!participant.success || participant.successType !== "full") {
        return {
            data: participant.validData,
            errors: participant.error?.flatten().fieldErrors
        }
    }

    const fullParse = participantSubmitSchema.parse(fdConstructed)
    console.log(JSON.stringify(fullParse))
    return prismaOrThrow("add participant")
        .participant
        .create({
            data: fullParse
        })
        .then((p) => {
            revalidatePath(`/tournaments/[tId]`, 'page')
            redirect(`/tournaments/${p.tournamentId}`, RedirectType.replace)
        }, e => {
            return {
                data: fullParse,
                errors: e
            }
        })
}

export async function listParticipants(tId: string) {
    return prismaOrThrow("list participants").participant.findMany({
        where: {
            tournamentId: tId
        }
    })

}

export async function removeParticipant(initialState: string) {
    return prismaOrThrow("remove participant").participant.delete({
        where: {
            id: initialState
        }
    }).then((p)=>{
        revalidatePath(`tournaments/${p.tournamentId}`)
    })
}