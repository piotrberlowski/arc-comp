import { listRoundFormats } from "@/app/tournaments/tournamentActions"
import { RoundFormat } from "@prisma/client"
import { useEffect, useState } from "react"


export default function RoundFormatSelect({ formatId, className, onChange }: { formatId?: string, className?: string, onChange: (f: string) => void }) {
    const [formats, setFormats] = useState<RoundFormat[]>([])

    useEffect(
        () => {
            listRoundFormats().then(f => {
                console.log(`${JSON.stringify(f)}`)
                if (!!f) {
                    setFormats(f)
                }
            })
        }
        , [])

    return (
        <select className={`select ${className}`} value={formatId} onChange={(evt) => onChange(evt.target.value)}>
            <option value="" disabled={true}>Round Format</option>
            {(formats && formats.map(f => (
                <option key={`rnd-format-${f.id}`} value={f.id}>{f.name}</option>
            )))}
        </select>
    )

}