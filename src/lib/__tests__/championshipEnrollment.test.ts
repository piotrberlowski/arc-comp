import { GenderGroup } from "@/generated/prisma/enums"
import {
    participantDataFromRegistration,
    participantUpdateFromRegistration,
} from "@/lib/championshipEnrollment"

describe("championshipEnrollment", () => {
    const registration = {
        name: "Alex Archer",
        membershipNo: "M-001",
        competitorNumber: 7,
        ageGroupId: "age-1",
        categoryId: "cat-1",
        club: "Club A",
        genderGroup: GenderGroup.M,
    }

    it("maps registration to participant create data", () => {
        expect(participantDataFromRegistration(registration, "tour-1")).toEqual({
            tournamentId: "tour-1",
            name: "Alex Archer",
            membershipNo: "M-001",
            competitorNumber: 7,
            ageGroupId: "age-1",
            categoryId: "cat-1",
            club: "Club A",
            genderGroup: GenderGroup.M,
            checkedIn: false,
        })
    })

    it("maps registration to participant update data without checkedIn", () => {
        expect(participantUpdateFromRegistration(registration)).toEqual({
            name: "Alex Archer",
            competitorNumber: 7,
            ageGroupId: "age-1",
            categoryId: "cat-1",
            club: "Club A",
            genderGroup: GenderGroup.M,
        })
    })
})
