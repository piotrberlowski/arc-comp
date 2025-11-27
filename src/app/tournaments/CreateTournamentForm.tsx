'use client'
import RoundFormatSelect from "@/components/RoundFormatSelect"
import ErrorAlert from "@/components/errors/ErrorAlert"
import { PencilSquareIcon } from "@heroicons/react/24/solid"
import Form from "next/form"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useFormStatus } from "react-dom"
import TournamentDayPicker from "./TournamentDayPicker"
import { createTournament } from "./tournamentActions"

export default function CreateTournamentForm({ clubs }: { clubs: string[] }) {
    const status = useFormStatus()
    const router = useRouter()
    const [formatId, setFormatId] = useState("")
    const [name, setName] = useState("")
    const [date, setDate] = useState(new Date())
    const [error, setError] = useState("")
    const [club, setClub] = useState(clubs.length > 0 ? clubs[0] : "")
    const [endCount, setEndCount] = useState<number>(28)
    const [groupSize, setGroupSize] = useState<number>(4)

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
        if (!endCount || endCount < 1) {
            errors.push("End count must be at least 1")
        }
        if (!groupSize || groupSize < 1) {
            errors.push("Group size must be at least 1")
        }
        if (errors.length > 0) {
            const err = errors.join("; ")
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
                    Format: <RoundFormatSelect className="select-sm select-accent text-primary-content" formatId={formatId} onChange={(format) => {
                        if (format) {
                            setFormatId(format.id)
                            setEndCount(format.endCount)
                            setGroupSize(format.groupSize)
                        }
                    }} />
                </span>
                <div className="flex justify-between p-3 bg-secondary rounded-md">
                    <input type="text" name="tournamentName" placeholder="Tournament name" className="card-title input input-primary validator" value={name} onChange={evt => setName(evt.target.value)} required></input>
                    <span className="text-xl"><TournamentDayPicker date={date} onChange={setDate} /></span>
                </div>
                <div className="flex gap-4 p-3 bg-base-200 rounded-md">
                    <div className="flex-1">
                        <label className="label">
                            <span className="label-text">End Count</span>
                        </label>
                        <input 
                            type="number" 
                            className="input input-bordered w-full" 
                            value={endCount} 
                            onChange={evt => setEndCount(Number(evt.target.value))}
                            min="1"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="label">
                            <span className="label-text">Group Size</span>
                        </label>
                        <input 
                            type="number" 
                            className="input input-bordered w-full" 
                            value={groupSize} 
                            onChange={evt => setGroupSize(Number(evt.target.value))}
                            min="1"
                            required
                        />
                    </div>
                </div>
                <ErrorAlert error={error} resetAction={() => setError("")} />
                <Form className="justify-end card-actions" action={() => {
                    if (validateInput()) {
                        createTournament(name, formatId, club, date, endCount, groupSize).then(
                            tgt => router.push(`/tournaments/${tgt}`)
                        ).catch(
                            e => {
                                console.error("Failed to create tournament:", e)
                                setError(e)
                            }
                        )
                    }
                }}>
                    <button type="submit" className="btn btn-success" disabled={status.pending}><PencilSquareIcon width={24} />Create!</button>
                </Form>
            </div>
        </div>
    )
}