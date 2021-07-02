import './Project.scss'
import {Parallax} from "react-scroll-parallax";
import {Box, Grid} from "@material-ui/core";
import { shadows } from '@material-ui/system';


export const Project = (props) => (
    <Parallax className="project" y={[-25,0]} tagOuter="figure">
        <Grid
            container
            direction="row"
            justify="space-evenly"
            alignItems="center"
            className={'project'}
        >
            <div>
                <h2>{props.title}</h2>
                <p className="project-desc">{props.text}</p>
            </div>
            <div>
                <Box>
                    <a href={props.link}>
                        <img src={props.image} className="project-image" ></img>
                    </a>
                </Box>
            </div>
        </Grid>
     </Parallax>
);
