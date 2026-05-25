import {
    formatDayEnrollAllMessage,
    formatEnrollAllDaysMessage,
} from "@/lib/championshipEnrollmentMessages"

describe("championshipEnrollmentMessages", () => {
    it("returns undefined when nobody was skipped", () => {
        expect(formatDayEnrollAllMessage({ enrolledCount: 3, skippedCount: 0 }, 1)).toBeUndefined()
    })

    it("describes partial day enroll", () => {
        expect(formatDayEnrollAllMessage({ enrolledCount: 3, skippedCount: 2 }, 2)).toBe(
            "Enrolled 3 on day 2. Skipped 2 without a range assignment for this day."
        )
    })

    it("describes partial enroll across all days", () => {
        expect(formatEnrollAllDaysMessage({ enrolledCount: 10, skippedCount: 4 })).toBe(
            "Enrolled 10 across all days. Skipped 4 without a range assignment on at least one day."
        )
    })
})
