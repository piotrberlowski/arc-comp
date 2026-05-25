import {
    participantDivisionAbbrev,
    participantProfileFieldKeys,
    participantProfileFields,
    participantProfileFromFormData,
} from "@/lib/participantProfileFields"
import { participantProfileSchema } from "@/lib/participantProfileSchema"

describe("participantProfileFields", () => {
    it("lists the same keys as participantProfileSchema", () => {
        expect(participantProfileFieldKeys.sort()).toEqual(
            Object.keys(participantProfileSchema.shape).sort()
        )
    })

    it("defines metadata for every schema key", () => {
        expect(participantProfileFields.map((field) => field.key).sort()).toEqual(
            participantProfileFieldKeys.sort()
        )
    })

    it("abbreviates division like the participant list", () => {
        expect(
            participantDivisionAbbrev({ ageGroupId: "A", genderGroup: "M", categoryId: "BBC" })
        ).toBe("AMBBC")
    })

    it("reads profile values from form data", () => {
        const formData = new FormData()
        formData.set("name", "Alex Archer")
        formData.set("membershipNo", "M-001")
        formData.set("club", "Club A")
        formData.set("ageGroupId", "A")
        formData.set("genderGroup", "M")
        formData.set("categoryId", "BBC")

        expect(participantProfileFromFormData(formData)).toEqual({
            name: "Alex Archer",
            membershipNo: "M-001",
            club: "Club A",
            ageGroupId: "A",
            genderGroup: "M",
            categoryId: "BBC",
        })
    })
})
