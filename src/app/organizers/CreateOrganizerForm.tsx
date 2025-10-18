"use client"

import Form from 'next/form'
import { useEffect, useState } from "react"
import { createOrganizer, listUsers } from "./organizersActions"
import { PlusCircleIcon } from "@heroicons/react/24/outline"

interface Candidate {
    id: string
    name: string
}

export default function CreateOrganizerForm({ revalidate }: { revalidate?: string }) {
    const [users, setUsers] = useState<Candidate[]>([])

    useEffect(() => {
        listUsers().then(res => {
            const candidates = res.map(v => { return { id: v.id, name: v.name ?? "" } })
            setUsers(candidates)
        })
    }, [])

    return (
        <Form className="flex w-full bg-base-300 gap-2 flex-wrap" action={createOrganizer}>
            <select name="userId" defaultValue="Select a user" className="select select-primary  flex-1 min-w-full lg:min-w-fit">
                <option disabled={true}>Select a user</option>
                {
                    (users && users.map( u => (<option key={`user-option-${u.id}`} value={u.id}>{u.name}</option>)))
                }
            </select>
            <input name="club" type="text" placeholder="Organization Name" className="input input-primary  flex-1 min-w-full lg:min-w-fit" />
            <input name="revalidate" type="hidden" value={revalidate}/>
            <button className="btn btn-primary flex-1 min-w-full lg:min-w-fit" type="submit"><PlusCircleIcon width={20}/> Add Tournament Organizer</button> 
        </Form>
    )

}