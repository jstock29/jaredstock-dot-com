import { Parallax } from 'react-scroll-parallax';
import './TextContent.scss'

export const TextContent = (props) => (
    <Parallax className="custom-class" y={[-20, 20]} tagOuter="figure">
            <h2>{props.title}</h2>
            <p>{props.text}</p>
    </Parallax>
);
