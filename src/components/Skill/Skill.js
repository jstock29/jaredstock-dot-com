import './Skill.scss'
import { Chip } from "@mui/material";


export function Skill(props) {
    if (props.color==='primary') {
        return (
            <Chip label={props.label} className={'skill-chip-primary'}/>
        )
    }else if (props.color==='secondary') {
        return (
            <Chip label={props.label} className={'skill-chip-secondary'}/>
        )
    }else{
        return (
            <Chip label={props.label} className={'skill-chip'}/>
        )
}
}
