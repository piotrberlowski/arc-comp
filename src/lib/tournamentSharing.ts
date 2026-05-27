export type SharingOption = "private" | "link-shared" | "public" | "mixed"

export function sharingOptionFromFlags(isPublished: boolean, isShared: boolean): SharingOption {
    if (isPublished && isShared) {
        return "public"
    }
    if (!isPublished && isShared) {
        return "link-shared"
    }
    return "private"
}

export function flagsFromSharingOption(option: Exclude<SharingOption, "mixed">): {
    isPublished: boolean
    isShared: boolean
} {
    switch (option) {
        case "private":
            return { isPublished: false, isShared: false }
        case "link-shared":
            return { isPublished: false, isShared: true }
        case "public":
            return { isPublished: true, isShared: true }
    }
}

export function aggregateSharingOption(
    tournaments: { isPublished: boolean; isShared: boolean }[]
): SharingOption {
    if (tournaments.length === 0) {
        return "private"
    }

    const first = sharingOptionFromFlags(tournaments[0].isPublished, tournaments[0].isShared)
    const allSame = tournaments.every(
        (tournament) => sharingOptionFromFlags(tournament.isPublished, tournament.isShared) === first
    )
    return allSame ? first : "mixed"
}
