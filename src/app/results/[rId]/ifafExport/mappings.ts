import { prismaOrThrow } from "@/lib/prisma"

export async function getIFAFBowStyleMapping(equipmentCategoryId: string) {
    return await prismaOrThrow("get IFAF bow style mapping").iFAFBowStyleMapping.findUnique({
        where: { equipmentCategoryId },
        include: { equipmentCategory: true }
    })
}

export async function getIFAFAgeGenderMapping(ageGroupId: string, genderGroup: string) {
    return await prismaOrThrow("get IFAF age gender mapping").iFAFAgeGenderMapping.findUnique({
        where: {
            ageGroupId_genderGroup: {
                ageGroupId,
                genderGroup
            }
        },
        include: { ageGroup: true }
    })
}
