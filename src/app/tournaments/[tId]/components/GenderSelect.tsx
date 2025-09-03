import {GenderGroup} from "@prisma/client"
import { SelectElementParams } from "./api"

export default function GenderSelect(props:SelectElementParams) {

    return (
        <select {...props} key={props.defaultValue}>
            <option value={GenderGroup.F} key="g-sel-F">Female</option>
            <option value={GenderGroup.M} key="g-sel-M">Male</option>
        </select>
    )
}