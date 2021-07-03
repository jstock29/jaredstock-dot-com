import './Project.scss'
import {Parallax} from "react-scroll-parallax";
import {Box, Grid} from "@material-ui/core";
import {GitHub, Link} from "@material-ui/icons";


export const Project = (props) => (
    <Parallax className="project" y={[-20,20]} tagOuter="figure">
        <Grid
            container
            direction="row"
            justify="space-evenly"
            alignItems="center"
            className={'project'}
        >
            <div>
                <h2 className={'project-heading'}>{props.title}</h2>
                <p className="project-desc">{props.text}</p>
                <a href={props.github} target="_blank"  rel="noreferrer" className="link-icon">
                    <GitHub style={{fontSize: 20}}/>
                </a>
                <a href={props.link} target="_blank"  rel="noreferrer" className="link-icon">
                    <Link style={{fontSize: 20}}/>
                </a>
            </div>
            <div>
                <Box>
                    <a href={props.link} target="_blank" rel="noreferrer">
                        <img src={props.image} className="project-image" alt={props.title}></img>
                    </a>
                </Box>
            </div>
        </Grid>
    </Parallax>
);
