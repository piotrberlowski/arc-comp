import { format } from "date-fns"
import DayGroupsPrintToolbar from "./DayGroupsPrintToolbar"
import PrintDayGroupAllocations from "./PrintDayGroupAllocations"
import type { PublicChampionshipDayGroupsPrintData } from "../championshipResultsActions"
import "./day-groups-print.css"

export default function DayGroupsPrintView({
    data,
    qrDataUrl,
    publicGroupsUrl,
}: {
    data: PublicChampionshipDayGroupsPrintData
    qrDataUrl: string
    publicGroupsUrl: string
}) {
    const dates = data.rounds.map((round) => round.date)
    const dateLabel =
        dates.length === 0
            ? null
            : dates.length === 1
              ? format(dates[0], "d MMM yyyy")
              : `${format(new Date(Math.min(...dates.map((date) => date.getTime()))), "d MMM yyyy")} – ${format(new Date(Math.max(...dates.map((date) => date.getTime()))), "d MMM yyyy")}`

    return (
        <div className="day-groups-print">
            <DayGroupsPrintToolbar />
            <header className="day-groups-print__header">
                <div className="day-groups-print__title-block">
                    <h1 className="day-groups-print__title">{data.championship.name}</h1>
                    <p className="day-groups-print__meta">{data.championship.organizerClub}</p>
                    <p className="day-groups-print__subtitle">
                        Day {data.dayOrder} — Target groups
                        {dateLabel ? ` · ${dateLabel}` : ""}
                    </p>
                </div>
                <div className="day-groups-print__qr-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={qrDataUrl}
                        alt="QR code linking to live target groups"
                        width={98}
                        height={98}
                        className="day-groups-print__qr"
                    />
                    <p className="day-groups-print__qr-hint">Scan for live groups</p>
                </div>
            </header>
            <PrintDayGroupAllocations
                dayOrder={data.dayOrder}
                rounds={data.rounds}
                groupsByTournamentId={data.groupsByTournamentId}
            />
            <p className="no-print text-[10px] text-base-content/50 mt-4 break-all">{publicGroupsUrl}</p>
        </div>
    )
}
