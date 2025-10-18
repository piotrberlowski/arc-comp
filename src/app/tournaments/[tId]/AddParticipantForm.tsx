'use client'
import AgeDivisionSelect from "./components/AgeDivisionSelect"
import EquipmentCategorySelect from "./components/EquipmentCategorySelect"

import ErrorAlert from "@/components/errors/ErrorAlert"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
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
            <Form action={addParticipantAction} className="flex mx-auto gap-1 items-center" >
                <div className="flex-1" />
                <input type="hidden" name="tId" value={tId} />
                <input type="text" name="name" className={`input ${addParticipantState.errors?.name ? 'input-error' : 'input-secondary'}`} placeholder="Archer's Name" defaultValue={addParticipantState.data?.name} />
                <input type="text" name="membershipNo" className={`input ${addParticipantState.errors?.membershipNo ? 'input-error' : 'input-secondary'}`} placeholder="Membership No." defaultValue={addParticipantState.data?.membershipNo} />
                <AgeDivisionSelect name="ageGroupId" className="flex-0 w-fit select select-secondary" defaultValue={addParticipantState.data?.ageGroupId} />
                <GenderSelect name="genderGroup" className="flex-0 w-fit select select-secondary" defaultValue={addParticipantState.data?.genderGroup} />
                <EquipmentCategorySelect name="categoryId" className="flex-0 w-fit select select-secondary" defaultValue={addParticipantState.data?.categoryId} />
                <input type="text" name="club" className="input input-secondary" placeholder="Archer's Club" defaultValue={addParticipantState.data?.club} />
                <button type="submit" className="btn btn-secondary" disabled={isPending}><PlusCircleIcon width={20} />Add</button>
                <input type="hidden" name="target" value={`/tournaments/[tId]/`} />
                <div className="flex-1" />
            </Form>
            <ErrorAlert error={Object.keys(addParticipantState.errors).length > 0 ? Object.values(addParticipantState.errors).join(', ') : undefined} resetAction={() => { addParticipantState.errors = {} }} />
        </div>
    )
}