import { getPublicChampionshipDayGroupsData } from "../../../championshipResultsActions"
import { generateQrDataUrl } from "@/lib/generateQrDataUrl"
import { buildPublicChampionshipResultsUrl } from "@/lib/publicChampionshipUrls"
import { getRequestOrigin } from "@/lib/requestOrigin"
import { notFound } from "next/navigation"
import DayGroupsPrintView from "../../DayGroupsPrintView"

export default async function PublicChampionshipDayGroupsPrintPage({
    params,
}: {
    params: Promise<{ cId: string; dayOrder: string }>
}) {
    const { cId, dayOrder: dayOrderParam } = await params
    const dayOrder = Number.parseInt(dayOrderParam, 10)
    if (!Number.isFinite(dayOrder) || dayOrder < 1) {
        notFound()
    }

    const data = await getPublicChampionshipDayGroupsData(cId, dayOrder)
    const origin = await getRequestOrigin()
    const publicGroupsUrl = buildPublicChampionshipResultsUrl(origin, cId, dayOrder)
    const qrDataUrl = await generateQrDataUrl(publicGroupsUrl)

    return <DayGroupsPrintView data={data} qrDataUrl={qrDataUrl} publicGroupsUrl={publicGroupsUrl} />
}
