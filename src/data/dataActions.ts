"use server"

import { prismaOrThrow } from "../../lib/prisma";

export async function listEquipmentCategories() {
    return prismaOrThrow("list equipment categories").equipmentCategory.findMany({
        orderBy: {
            id: "asc"
        }
    })
}

export async function listAgeDivisions() {
    return prismaOrThrow("list age divisions").ageGroup.findMany(
        {
            orderBy: {
                id: "asc"
            }
        }
    )
}
