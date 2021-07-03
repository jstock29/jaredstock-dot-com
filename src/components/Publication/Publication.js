import './Publication.scss'
import {Parallax} from "react-scroll-parallax";
import {Box, Grid} from "@material-ui/core";
import {Link} from "@material-ui/icons";


export const Publication = (props) => (
    <Parallax className="publication" y={[-20,20]} tagOuter="figure">
        <Grid
            container
            direction="row"
            justify="space-evenly"
            alignItems="center"
            className={'publication'}
        >
            <div className={'content'}>
                <h2>{props.title}</h2>
                <p>{props.text}</p>
                <a href={props.link} target="_blank" rel="noreferrer" className="link-icon">
                    <Link style={{fontSize: 20}}/>
                </a>
            </div>
            <div>
                <Box>
                    <a href={props.link} target="_blank" rel="noreferrer">
                        <img src={props.image} className="pub-image" alt={props.title}></img>
                    </a>
                </Box>
            </div>
        </Grid>
     </Parallax>
);
