export type IfafExportParticipant = {
    name: string
    membershipNo: string
    club: string
    ageGroupId: string
    categoryId: string
    genderGroup: string
    /** One cell per score column from E onward (e.g. `[dayTotal]` or `[range1, range2, total]`). */
    scoreColumns: string[]
}

export type IfafExportData = {
    organizerClub: string
    roundLabel: string
    participantCount: number
    dateStart: Date
    dateEnd: Date
    /** Score column titles from E onward (multi-range: one per range, then "total"). */
    scoreColumnHeaders?: string[]
    /** Used for download filename when set (combined championship export). */
    fileNameStem?: string
    participants: IfafExportParticipant[]
}
