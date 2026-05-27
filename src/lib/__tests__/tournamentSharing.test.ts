import {
    aggregateSharingOption,
    flagsFromSharingOption,
    sharingOptionFromFlags,
} from "../tournamentSharing"

describe("sharingOptionFromFlags", () => {
    it("maps private, link-shared, and public flags", () => {
        expect(sharingOptionFromFlags(false, false)).toBe("private")
        expect(sharingOptionFromFlags(false, true)).toBe("link-shared")
        expect(sharingOptionFromFlags(true, true)).toBe("public")
    })
})

describe("flagsFromSharingOption", () => {
    it("maps options back to flags", () => {
        expect(flagsFromSharingOption("private")).toEqual({ isPublished: false, isShared: false })
        expect(flagsFromSharingOption("link-shared")).toEqual({ isPublished: false, isShared: true })
        expect(flagsFromSharingOption("public")).toEqual({ isPublished: true, isShared: true })
    })
})

describe("aggregateSharingOption", () => {
    it("returns private when there are no tournaments", () => {
        expect(aggregateSharingOption([])).toBe("private")
    })

    it("returns the shared option when all tournaments match", () => {
        expect(
            aggregateSharingOption([
                { isPublished: false, isShared: true },
                { isPublished: false, isShared: true },
            ])
        ).toBe("link-shared")
    })

    it("returns mixed when tournaments differ", () => {
        expect(
            aggregateSharingOption([
                { isPublished: false, isShared: false },
                { isPublished: false, isShared: true },
            ])
        ).toBe("mixed")
    })
})
