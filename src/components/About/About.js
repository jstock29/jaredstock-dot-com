import './About.scss'
import {ParallaxBanner} from "react-scroll-parallax";


export const About = (props) => (
    <div>
        <ParallaxBanner
            className=""
            layers={[
                {
                    image: 'https://jareds-file-sharing.s3.amazonaws.com/jared_on_stuff.jpeg',
                    amount: 0.1,
                },
            ]}
            style={{
                height: '600px',
            }}
        >
        </ParallaxBanner>
        <p className="about-desc">My name is Jared and I make things on the internet. I'm now a Senior Consultant and Lead Developer at Arup, where I lead a small team of junior developers, deliver solutions across the development stack, and drive the direction of digital in the Americas.</p>
        <p className="about-desc">I'm from beautiful Colorado, but I currently live in New York City and can give plenty of recommendations for bagels, pizza, and more. I love podcasts, running in Central Park, reading too much sci-fi, and hiking to stand on top of tall things.</p>
    </div>
);
