import useSWR from "swr";
import { listAgeDivisions, listEquipmentCategories } from "./dataActions";

export function useAgeDivisions() {
    const {data, error, isLoading} = useSWR("/data/ageDivisions", listAgeDivisions)

    return {
        ageDivisions: data,
        error: error,
        isLoading
    }
}

export function useEquipmentCategories() {
    const {data, error, isLoading} = useSWR("/data/equipmentCategories", listEquipmentCategories)

    return {
        categories: data,
        error: error,
        isLoading
    }
}