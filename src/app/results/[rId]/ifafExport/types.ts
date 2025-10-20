export interface IFAFExportData {
    tournamentName: string
    date: string
    organizer: string
    results: Array<{
        bowStyle: string
        category: string
        place: number
        name: string
        membershipNumber?: string
        club: string
        score: number
    }>
}

export interface IFAFTransformedData {
    tournamentInfo: {
        name: string
        date: string
        organizer: string
    }
    bowStyleGroups: Array<{
        bowStyle: {
            code: string
            name: string
            number: string
        }
        ageGenderGroups: Array<{
            category: {
                code: string
                name: string
            }
            participants: Array<{
                name: string
                membershipNumber?: string
                club: string
                score: number
                place: number
            }>
        }>
    }>
}
