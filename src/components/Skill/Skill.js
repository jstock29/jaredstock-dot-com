import './Skill.scss'
import {Chip} from "@material-ui/core";


export const Skill = (props) => (
    <Chip label={props.label} color={props.color} className={'skill-chip'}/>
);
