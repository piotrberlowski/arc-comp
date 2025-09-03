import { useEquipmentCategories } from "@/data/dataHooks"
import { SelectElementParams } from "./api"

export default function EquipmentCategorySelect(props:SelectElementParams) {
    
    const {categories, error, isLoading} = useEquipmentCategories()

    if (isLoading) {
        return (
            <span className="loading loading-infinity loading-md"></span>
        )
    }

    if (!!error) {
        return (
            <div role="alert" className="alert alert-error">
                {JSON.stringify(error)}
            </div>
        )
    }

    return (
        <select {...props} key={props.defaultValue}>
            {
                categories?.map(c => {
                    return (<option key={`eq-select-${c.id}`} value={c.id}>{c.name}</option>)
                })
            }
        </select>

    )

}