import { prismaOrThrow } from "@/lib/prisma"
import { join } from "path"
import { IFAFExcellExporter } from "./ifafExcellExporter"

export async function loadIfafExporter(): Promise<IFAFExcellExporter> {
    const templatePath = join(process.cwd(), "resources", "templatev5.xlsx")

    const [iFAFBowStyleMappings, iFAFAgeGenderMappings] = await Promise.all([
        prismaOrThrow("get all IFAF bow style mappings").iFAFBowStyleMapping.findMany({
            orderBy: { ifafBowStyleNumber: "asc" },
            include: { equipmentCategory: true },
        }),
        prismaOrThrow("get all IFAF age gender mappings").iFAFAgeGenderMapping.findMany({
            include: { ageGroup: true },
        }),
    ])

    return new IFAFExcellExporter(templatePath, iFAFBowStyleMappings, iFAFAgeGenderMappings)
}
