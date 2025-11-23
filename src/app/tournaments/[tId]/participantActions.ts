"use server"

import { prismaOrThrow } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect, RedirectType } from "next/navigation"
import { z } from "zod"
import { zu } from 'zod_utilz'

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
    checkedIn: z.boolean().default(false),
})

export interface AddParticipantState {

    data?: {
        name?: string
        membershipNo?: string
        genderGroup?: "F" | "M"
        ageGroupId?: string
        categoryId?: string
        club?: string
        checkedIn?: boolean
    }
    errors: Record<string, string>

}

export async function addParticipant(initialState: AddParticipantState, fd: FormData): Promise<AddParticipantState> {
    const participantId = fd.get('participantId')
    const hasParticipantId = participantId && typeof participantId === 'string' && participantId !== ''

    const checkedInValue = fd.get('checkedIn')
    const checkedIn = checkedInValue === 'true'

    const fdConstructed = {
        tournamentId: fd.get('tId'),
        name: fd.get('name'),
        membershipNo: fd.get('membershipNo'),
        genderGroup: fd.get('genderGroup'),
        ageGroupId: fd.get('ageGroupId'),
        categoryId: fd.get('categoryId'),
        club: fd.get('club'),
        checkedIn
    }

    const participant = zu.partialSafeParse(participantSubmitSchema, fdConstructed)

    if (!participant.success || participant.successType !== "full") {
        return {
            data: participant.validData,
            errors: participant.error?.flatten().fieldErrors || {}
        }
    }

    const fullParse = participantSubmitSchema.parse(fdConstructed)

    if (hasParticipantId) {
        return prismaOrThrow("update participant")
            .participant
            .update({
                where: { id: participantId as string },
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
    } else {
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
    }).then((p) => {
        revalidatePath(`tournaments/${p.tournamentId}`)
    })
}

export async function checkInParticipant(participantId: string): Promise<void> {
    const participant = await prismaOrThrow("check in participant").participant.update({
        where: { id: participantId },
        data: { checkedIn: true }
    })
    revalidatePath(`/tournaments/[tId]`, 'page')
    revalidatePath(`/tournaments/${participant.tournamentId}/groups`, 'page')
}

export async function uncheckParticipant(participantId: string): Promise<void> {
    const participant = await prismaOrThrow("get participant for uncheck").participant.findUnique({
        where: { id: participantId },
        include: { groupAssignment: true }
    })

    if (!participant) {
        throw new Error("Participant not found")
    }

    // Remove group assignment if participant is in a group
    if (participant.groupAssignment) {
        await prismaOrThrow("remove group assignment on uncheck").groupAssignment.delete({
            where: {
                participantId_tournamentId: {
                    participantId,
                    tournamentId: participant.tournamentId
                }
            }
        })
    }

    await prismaOrThrow("uncheck participant").participant.update({
        where: { id: participantId },
        data: { checkedIn: false }
    })

    revalidatePath(`/tournaments/[tId]`, 'page')
    revalidatePath(`/tournaments/${participant.tournamentId}/groups`, 'page')
}