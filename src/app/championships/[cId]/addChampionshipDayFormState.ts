export interface AddChampionshipDayFormState {
    success?: boolean
    data?: {
        name?: string
        formatId?: string
        date?: Date
        endCount?: number
        groupSize?: number
    }
    errors: Record<string, string>
}

export const initialAddChampionshipDayFormState: AddChampionshipDayFormState = {
    errors: {},
}
