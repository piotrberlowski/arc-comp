'use client'
import AgeDivisionSelect from "./components/AgeDivisionSelect"
import EquipmentCategorySelect from "./components/EquipmentCategorySelect"

import ErrorAlert from "@/components/errors/ErrorAlert"
import { CheckCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline"
import Form from "next/form"
import { useActionState } from "react"
import GenderSelect from "./components/GenderSelect"
import { addParticipant, AddParticipantState } from "./participantActions"

const initialState: AddParticipantState = {
    data: {},
    errors: {}
}

export default function AddParticipantForm({ tId }: { tId: string }) {

    const [addParticipantState, addParticipantAction, isPending] = useActionState(addParticipant, initialState, `/tournaments/${tId}`)

    return (
        <div className="my-2 flex flex-col gap-1">
            <Form action={addParticipantAction} className="flex mx-auto gap-1 items-center items-stretch" >
                <input type="hidden" name="tId" value={tId} />
                <div className="flex-1 flex gap-1 flex-wrap items-stretch">
                    <input type="text" name="name" className={`sm:w-2/5 input input-xs md:input-sm flex-grow ${addParticipantState.errors?.name ? 'input-error' : 'input-secondary'}`} placeholder="Archer's Name" defaultValue={addParticipantState.data?.name} />
                    <input type="text" name="membershipNo" className={`w-fit input input-xs md:input-sm flex-grow ${addParticipantState.errors?.membershipNo ? 'input-error' : 'input-secondary'}`} placeholder="Membership No." defaultValue={addParticipantState.data?.membershipNo} />
                    <input type="text" name="club" className="sm:w-2/5 input input-xs md:input-sm input-secondary flex-grow" placeholder="Archer's Club" defaultValue={addParticipantState.data?.club} />
                    <AgeDivisionSelect name="ageGroupId" className="min-w-fit select select-xs md:select-sm select-secondary w-2/5 md:w-1/3 flex-1" defaultValue={addParticipantState.data?.ageGroupId} />
                    <GenderSelect name="genderGroup" className="min-w-fit select select-xs md:select-sm select-secondary w-2/5 md:w-1/3 flex-1" defaultValue={addParticipantState.data?.genderGroup} />
                    <EquipmentCategorySelect name="categoryId" className="min-w-fit select select-xs md:select-sm select-secondary md:w-1/3 flex-1 " defaultValue={addParticipantState.data?.categoryId} />
                </div>
                <div className="flex-0 flex flex-col gap-1">
                    <button type="submit" name="checkedIn" value="false" className="flex-1 min-w-fit btn btn-xs md:btn-sm btn-secondary" disabled={isPending}><PlusCircleIcon className="w-4 h-4" /><span className="hidden md:block">Preregister</span></button>
                    <button type="submit" name="checkedIn" value="true" className="flex-1 min-w-fit btn btn-xs md:btn-sm btn-success" disabled={isPending}><CheckCircleIcon className="w-4 h-4" /><span className="hidden md:block">Check&nbsp;In</span></button>
                </div>
                <input type="hidden" name="target" value={`/tournaments/[tId]/`} />
            </Form>
            <ErrorAlert error={Object.keys(addParticipantState.errors).length > 0 ? Object.values(addParticipantState.errors).join(', ') : undefined} resetAction={() => { addParticipantState.errors = {} }} />
        </div>
    )
}