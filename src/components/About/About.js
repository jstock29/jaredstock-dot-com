import './About.scss'
import {ParallaxBanner} from "react-scroll-parallax";


export const About = (props) => (
    <div>
        <ParallaxBanner
            className=""
            layers={[
                {
                    image: 'https://jareds-file-sharing.s3.amazonaws.com/jared_on_stuff_sq.jpg',
                    amount: 0.1,
                },
            ]}
            style={{
                height: '600px',
            }}
        >
        </ParallaxBanner>
        <p className="about-desc">My name is Jared, and I make stuff. </p>
    </div>
);
