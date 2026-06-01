import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DB_POSTGRES_PRISMA_URL!,
    }),
})

const roundFormats = [
    { name: "Unmarked Animal Round", shortName: "UAR" },
    { name: "3D-Standard Round", shortName: "3D-Std" },
    { name: "3D Hunting Round (1 Arrow)", shortName: "3D Hunting" },
    { name: "Field Round", shortName: "Field" },
    { name: "Hunter Round (Field)", shortName: "Hunter" },
    { name: "Marked Animal Round", shortName: "MAR" },
    { name: "Flint Round", shortName: "Flint", endCount: 14, groupSize: 2 },
    { name: "Indoor Round", shortName: "Indoor", endCount: 12 },
    { name: "Custom", shortName: "Custom" },
] as const

/** Pre–shortName seed rows kept the shorter `name` values; upsert those too. */
const legacyRoundFormats = [
    { name: "Flint", shortName: "Flint", endCount: 14, groupSize: 2 },
    { name: "Indoor", shortName: "Indoor", endCount: 12 },
] as const

async function seedRoundFormats() {
    for (const format of [...roundFormats, ...legacyRoundFormats]) {
        await prisma.roundFormat.upsert({
            where: { name: format.name },
            create: { ...format },
            update: { shortName: format.shortName },
        })
    }
}

async function main() {
    await seedRoundFormats()

    await Promise.all([
        prisma.user.updateMany({
            where: {
                email: "piotr.berlowski@gmail.com",
            },
            data: {
                isAdmin: true,
            },
        }),
        prisma.ageGroup.createMany({
            data: [
                { id: "C", name: "Cub" },
                { id: "J", name: "Junior" },
                { id: "YA", name: "Young Adult" },
                { id: "A", name: "Adult" },
                { id: "V", name: "Veteran" },
                { id: "S", name: "Senior" },
            ],
            skipDuplicates: true,
        }),
        prisma.equipmentCategory.createMany({
            data: [
                { id: "HB", name: "Historical Bow" },
                { id: "LB", name: "Longbow" },
                { id: "TR", name: "Traditional Recurve" },
                { id: "BHR", name: "Bowhunter Recurve" },
                { id: "BHC", name: "Bowhunter Compound" },
                { id: "BU", name: "Bowhunter Unlimited" },
                { id: "BL", name: "Bowhunter Limited" },
                { id: "BBR", name: "Barebow Recurve" },
                { id: "BBC", name: "Barebow Compound" },
                { id: "FSC", name: "Freestyle Compound" },
                { id: "FSR", name: "Freestyle Recurve" },
                { id: "FU", name: "Freestyle Unlimited" },
                { id: "PFAA-ETR", name: "PFAA Eastern Thumb Ring / Zekier" },
            ],
            skipDuplicates: true,
        }),
    ])

    await Promise.all([
        prisma.iFAFBowStyleMapping.createMany({
            data: [
                { equipmentCategoryId: "BBC", ifafBowStyleCode: "BB-C", ifafBowStyleName: "Barebow Compound (BB-C)", ifafBowStyleNumber: "01" },
                { equipmentCategoryId: "BBR", ifafBowStyleCode: "BB-R", ifafBowStyleName: "Barebow Recurve (BB-R)", ifafBowStyleNumber: "02" },
                { equipmentCategoryId: "BHC", ifafBowStyleCode: "BH-C", ifafBowStyleName: "Bowhunter Compound (BH-C)", ifafBowStyleNumber: "03" },
                { equipmentCategoryId: "BHR", ifafBowStyleCode: "BH-R", ifafBowStyleName: "Bowhunter Recurve (BH-R)", ifafBowStyleNumber: "04" },
                { equipmentCategoryId: "BL", ifafBowStyleCode: "BL", ifafBowStyleName: "Bowhunter Limited (BL)", ifafBowStyleNumber: "05" },
                { equipmentCategoryId: "BU", ifafBowStyleCode: "BU", ifafBowStyleName: "Bowhunter Unlimited (BU)", ifafBowStyleNumber: "06" },
                { equipmentCategoryId: "FSC", ifafBowStyleCode: "FS-C", ifafBowStyleName: "Freestyle Ltd. Compound (FS-C)", ifafBowStyleNumber: "07" },
                { equipmentCategoryId: "FSR", ifafBowStyleCode: "FS-R", ifafBowStyleName: "Freestyle Ltd. Recurve (FS-R)", ifafBowStyleNumber: "08" },
                { equipmentCategoryId: "FU", ifafBowStyleCode: "FU", ifafBowStyleName: "Freestyle Unlimited (FU)", ifafBowStyleNumber: "09" },
                { equipmentCategoryId: "LB", ifafBowStyleCode: "LB", ifafBowStyleName: "Longbow (LB)", ifafBowStyleNumber: "10" },
                { equipmentCategoryId: "HB", ifafBowStyleCode: "HB", ifafBowStyleName: "Historical Bow (HB)", ifafBowStyleNumber: "11" },
                { equipmentCategoryId: "TR", ifafBowStyleCode: "TR-IFAA", ifafBowStyleName: "Trad. Recurve (TR)", ifafBowStyleNumber: "12" },
            ],
            skipDuplicates: true,
        }),
        prisma.iFAFAgeGenderMapping.createMany({
            data: [
                { ageGroupId: "S", genderGroup: "M", ifafCategoryCode: "0", ifafCategoryName: "Senior Male" },
                { ageGroupId: "S", genderGroup: "F", ifafCategoryCode: "1", ifafCategoryName: "Senior Female" },
                { ageGroupId: "V", genderGroup: "M", ifafCategoryCode: "2", ifafCategoryName: "Veteran Male" },
                { ageGroupId: "V", genderGroup: "F", ifafCategoryCode: "3", ifafCategoryName: "Veteran Female" },
                { ageGroupId: "A", genderGroup: "M", ifafCategoryCode: "4", ifafCategoryName: "Adult Male" },
                { ageGroupId: "A", genderGroup: "F", ifafCategoryCode: "5", ifafCategoryName: "Adult Female" },
                { ageGroupId: "YA", genderGroup: "M", ifafCategoryCode: "6", ifafCategoryName: "Young Adult Male" },
                { ageGroupId: "YA", genderGroup: "F", ifafCategoryCode: "7", ifafCategoryName: "Young Adult Female" },
                { ageGroupId: "J", genderGroup: "M", ifafCategoryCode: "8", ifafCategoryName: "Junior Male" },
                { ageGroupId: "J", genderGroup: "F", ifafCategoryCode: "9", ifafCategoryName: "Junior Female" },
                { ageGroupId: "C", genderGroup: "M", ifafCategoryCode: "10", ifafCategoryName: "Cub Male" },
                { ageGroupId: "C", genderGroup: "F", ifafCategoryCode: "11", ifafCategoryName: "Cub Female" },
            ],
            skipDuplicates: true,
        }),
    ])
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
