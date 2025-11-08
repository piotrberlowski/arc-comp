'use client'
import AgeDivisionSelect from "./components/AgeDivisionSelect"
import EquipmentCategorySelect from "./components/EquipmentCategorySelect"

import ErrorAlert from "@/components/errors/ErrorAlert"
import { CheckCircleIcon, PencilIcon, PlusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { Participant } from "@prisma/client"
import Form from "next/form"
import { useActionState } from "react"
import GenderSelect from "./components/GenderSelect"
import { addParticipant, AddParticipantState } from "./participantActions"

const initialState: AddParticipantState = {
    data: {},
    errors: {}
}

interface AddParticipantFormProps {
    tId: string
    participant?: Participant | null
    onCancel?: () => void
}

export default function AddParticipantForm({ tId, participant, onCancel }: AddParticipantFormProps) {
    const participantId = participant?.id

    const [formState, formAction, isPending] = useActionState(addParticipant, initialState, `/tournaments/${tId}`)

    const defaultName = participant?.name || formState.data?.name || ''
    const defaultMembershipNo = participant?.membershipNo || formState.data?.membershipNo || ''
    const defaultClub = participant?.club || formState.data?.club || ''
    const defaultAgeGroupId = participant?.ageGroupId || formState.data?.ageGroupId || ''
    const defaultGenderGroup = participant?.genderGroup || formState.data?.genderGroup
    const defaultCategoryId = participant?.categoryId || formState.data?.categoryId || ''
    const defaultCheckedIn = participant?.checkedIn ?? formState.data?.checkedIn ?? false

    return (
        <div className="my-2 flex flex-col gap-1">
            {participantId && (
                <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold">Editing: {participant?.name}</span>
                </div>
            )}
            <Form action={formAction} className="flex mx-auto gap-1 items-center items-stretch" >
                <input type="hidden" name="tId" value={tId} />
                <input type="hidden" name="participantId" value={participantId || ''} />
                <div className="flex-1 flex gap-1 flex-wrap items-stretch">
                    <input type="text" name="name" className={`sm:w-2/5 input input-xs md:input-sm flex-grow ${formState.errors?.name ? 'input-error' : 'input-secondary'}`} placeholder="Archer's Name" defaultValue={defaultName} />
                    <input type="text" name="membershipNo" className={`w-fit input input-xs md:input-sm flex-grow ${formState.errors?.membershipNo ? 'input-error' : 'input-secondary'}`} placeholder="Membership No." defaultValue={defaultMembershipNo} />
                    <input type="text" name="club" className="sm:w-2/5 input input-xs md:input-sm input-secondary flex-grow" placeholder="Archer's Club" defaultValue={defaultClub} />
                    <AgeDivisionSelect name="ageGroupId" className="min-w-fit select select-xs md:select-sm select-secondary w-2/5 md:w-1/3 flex-1" defaultValue={defaultAgeGroupId} />
                    <GenderSelect name="genderGroup" className="min-w-fit select select-xs md:select-sm select-secondary w-2/5 md:w-1/3 flex-1" defaultValue={defaultGenderGroup} />
                    <EquipmentCategorySelect name="categoryId" className="min-w-fit select select-xs md:select-sm select-secondary md:w-1/3 flex-1 " defaultValue={defaultCategoryId} />
                </div>
                <div className="flex-0 flex flex-col gap-1">
                    {participantId ? (
                        <>
                            {onCancel && (
                                <button type="button" onClick={onCancel} className="btn btn-sm btn-ghost">
                                    <XMarkIcon className="w-4 h-4" />
                                    <span className="hidden md:inline">Cancel</span>
                                </button>
                            )}

                            <button type="submit" name="checkedIn" value={defaultCheckedIn ? 'true' : 'false'} className="flex-1 min-w-fit btn btn-xs md:btn-sm btn-primary" disabled={isPending}>
                                <PencilIcon className="w-4 h-4" />
                                <span className="hidden md:block">Update</span>
                            </button>

                        </>
                    ) : (
                        <>
                            <button type="submit" name="checkedIn" value="false" className="flex-1 min-w-fit btn btn-xs md:btn-sm btn-secondary" disabled={isPending}><PlusCircleIcon className="w-4 h-4" /><span className="hidden md:block">Preregister</span></button>
                            <button type="submit" name="checkedIn" value="true" className="flex-1 min-w-fit btn btn-xs md:btn-sm btn-success" disabled={isPending}><CheckCircleIcon className="w-4 h-4" /><span className="hidden md:block">Check&nbsp;In</span></button>
                        </>
                    )}
                </div>
                <input type="hidden" name="target" value={`/tournaments/[tId]/`} />
            </Form>
            <ErrorAlert error={Object.keys(formState.errors).length > 0 ? Object.values(formState.errors).join(', ') : undefined} resetAction={() => { formState.errors = {} }} />
        </div>
    )
}