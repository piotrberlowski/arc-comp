'use client'
import RoundFormatSelect from "@/components/RoundFormatSelect"
import TournamentDayPicker from "./TournamentDayPicker"
import { PencilSquareIcon } from "@heroicons/react/24/solid"
import { useFormStatus } from "react-dom"
import Form from "next/form"
import { useState } from "react"
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { createTournament } from "./tournamentActions"
import { useRouter } from "next/navigation"
import ErrorAlert from "@/components/ErrorAlert"

export default function CreateTournamentForm({clubs}:{clubs: string[]}) {
    const status = useFormStatus()
    const router = useRouter()
    const [formatId, setFormatId] = useState("")
    const [name, setName] = useState("")
    const [date, setDate] = useState(new Date())
    const [error, setError] = useState("")
    const [club, setClub] = useState(clubs.length>0 ? clubs[0] : "")

    function validateInput() {
        const errors = []
        if (!name) {
            errors.push("Name cannot be empty")
        }
        if (!formatId) {
            errors.push("Round format must be selected")
        }
        if (!club) {
            errors.push("Organizing Club must be selected")
        }
        if (errors.length > 0) {
            const err = errors.join("; ")
            console.log(err)
            setError(err)
            return false
        }
        return true
    }

    return (
        <div className="card w-full bg-base-300 card-sm shadow-sm ">
                <select className="select select-primary w-full bg-base-200" value={club} onChange={evt => setClub(evt.target.value)}>
                    {clubs.map(c => (
                        <option key={`club-select-${c}`} value={c}>{c}</option>
                    ))}
                </select>
            <div className="card-body">
                <span className="badge badge-info text-lg py-6">
                        Format: <RoundFormatSelect className="select-sm select-accent text-primary-content" formatId={formatId} onChange={setFormatId}/>
                </span>
                <div className="flex justify-between p-3 bg-secondary rounded-md">
                    <input type="text" name="tournamentName" placeholder="Tournament name" className="card-title input input-primary validator" value={name} onChange={evt=> setName(evt.target.value)} required></input>
                    <span className="text-xl"><TournamentDayPicker date={date} onChange={setDate} /></span>
                </div>
                <ErrorAlert error={error} resetAction={() => setError("")}/>
                <Form className="justify-end card-actions" action={() => {
                    if (validateInput()) {
                        createTournament(name, formatId, club, date).then(
                            tgt => router.push(`/tournaments/${tgt}`)
                        ).catch(
                            e => setError(e)
                        )
                    }
                }}>
                    <button type="submit" className="btn btn-success" disabled={status.pending}><PencilSquareIcon width={24} />Create!</button>
                </Form>
            </div>
        </div>
    )
}