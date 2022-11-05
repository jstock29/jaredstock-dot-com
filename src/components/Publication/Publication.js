import './Publication.scss'
import {Parallax} from "react-scroll-parallax";
import { Box, Grid } from "@mui/material";
import { Link } from "@mui/material";

function isMobile() {
    let width = window.innerWidth;
    if (width <= 768) {
        return true;
    } else {
        return false;
    }
}


export function Publication(props) {
    if (!isMobile()) {
        if (props.alternate) {
            return (
                <Parallax className="publication" y={[-20, 20]} tagOuter="figure">
                    <Grid
                        container
                        direction="row"
                        justify="space-evenly"
                        alignItems="center"
                        className={'publication'}
                    >
                        <div className={'content'}>
                            <a href={props.link} target="_blank" rel="noreferrer" className="link-icon">
                                <h2>{props.title}</h2>
                            </a>
                            <p>{props.text} <a href={props.link} target="_blank" rel="noreferrer" className="link-icon">
                                <Link style={{fontSize: 20}}/>
                            </a></p>

                        </div>
                        <div>
                            <Box>
                                <a href={props.link} target="_blank" rel="noreferrer">
                                    <img src={props.image} className="pub-image responsive" alt={props.title}></img>
                                </a>
                            </Box>
                        </div>
                    </Grid>
                </Parallax>
            )
        } else {
            return (
                <Parallax className="publication" y={[-20, 20]} tagOuter="figure">
                    <Grid
                        container
                        direction="row"
                        justify="space-evenly"
                        alignItems="center"
                        className={'publication'}
                    >
                        <div>
                            <Box>
                                <a href={props.link} target="_blank" rel="noreferrer">
                                    <img src={props.image} className="pub-image responsive" alt={props.title}></img>
                                </a>
                            </Box>
                        </div>
                        <div className={'content'}>
                            <a href={props.link} target="_blank" rel="noreferrer" className="link-icon">
                                <h2>{props.title}</h2>
                            </a>
                            <p>{props.text} <a href={props.link} target="_blank" rel="noreferrer" className="link-icon">
                                <Link style={{fontSize: 20}}/>
                            </a></p>
                        </div>
                    </Grid>
                </Parallax>
            )
        }
    } else {
        return (
            <Parallax className="publication" y={[-20, 20]} tagOuter="figure">
                <Grid
                    container
                    direction="row"
                    justify="space-evenly"
                    alignItems="center"
                    className={'publication'}
                >
                    <div>
                        <Box>
                            <a href={props.link} target="_blank" rel="noreferrer">
                                <img src={props.image} className="responsive" alt={props.title}></img>
                            </a>
                        </Box>
                    </div>
                    <div className={'content'}>
                        <a href={props.link} target="_blank" rel="noreferrer" className="link-icon">
                            <h2 className={'article-title'}>{props.title}</h2>
                        </a>
                        <p className={'publisher'}>{props.text} <a href={props.link} target="_blank" rel="noreferrer" className="link-icon">
                            <Link style={{fontSize: 20}}/>
                        </a></p>
                    </div>
                </Grid>
            </Parallax>
        )
    }
}

