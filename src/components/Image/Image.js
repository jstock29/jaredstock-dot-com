import { Parallax } from 'react-scroll-parallax';
import './Image.scss'

export const Image = (props) => (
    <Parallax className="custom-class" y={[-20, 20]} tagOuter="figure">
        <img src={props.image_url} alt={props.image_url} className='parallax-image'/>
    </Parallax>
);
