import './Scroll.scss'
import {Grid} from "@material-ui/core";
import {EmailOutlined, GitHub, LinkedIn, Twitter} from "@material-ui/icons";

export const Scroll = () => (
    <div className="scroll">
        <h1 className="title">Jared Stock</h1>
        <svg version="1.1" x="0px" y="0px" viewBox="0 0 167 299" className="pointer">
            <polygon className="fill-1" points="167,50 83.5,270 0,50 "/>
            <polygon className="fill-2" points="137.4,0 83.5,145.9 29.6,0 "/>
        </svg>
        <Grid
            container
            direction="row"
            justify="space-evenly"
            alignItems="center"
        >
            <a href="https://github.com/jstock29" title="Github" target="_blank"  rel="noreferrer" className="link-icon">
                <GitHub style={{fontSize: 26}}/>
            </a>
            <a href="https://twitter.com/jaredstock" title="Twitter" target="_blank"  rel="noreferrer" className="link-icon">
                <Twitter style={{fontSize: 26}}/>
            </a>
            <a href="https://www.linkedin.com/in/jaredstock/" title="LinkedIn" target="_blank"  rel="noreferrer" className="link-icon">
                <LinkedIn style={{fontSize: 26}}/>
            </a>
            <a href="mailto:jstock529@gmail.com" title="Email" target="_blank"  rel="noreferrer" className="link-icon">
                <EmailOutlined style={{fontSize: 26}}/>
            </a>
        </Grid>
    </div>

);
