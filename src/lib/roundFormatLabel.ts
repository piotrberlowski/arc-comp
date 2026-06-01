export type RoundFormatLabelSource = {
    name: string
    shortName: string | null
}

export function roundFormatShortLabel(format: RoundFormatLabelSource): string {
    return format.shortName ?? format.name
}
