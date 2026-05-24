import { z } from "zod"

export const participantProfileSchema = z.object({
    name: z.string().trim().min(3, "Name must be at least 3 characters long"),
    membershipNo: z.string().trim().min(1, "Membership number is required"),
    genderGroup: z.enum(["F", "M"], { message: "Gender must be selected" }),
    ageGroupId: z.string().min(1, "Age division must be selected"),
    categoryId: z.string().min(1, "Equipment category must be selected"),
    club: z.string().trim().min(1, "Club is required"),
})

export type ParticipantProfileInput = z.infer<typeof participantProfileSchema>
