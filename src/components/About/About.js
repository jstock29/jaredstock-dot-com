import React from "react";
import './About.scss'
import {ParallaxBanner} from "react-scroll-parallax";

const small = 'https://jareds-file-sharing.s3.amazonaws.com/jared_on_stuff_sq.jpg';
const medium = 'https://jareds-file-sharing.s3.amazonaws.com/jared_on_stuff.jpeg';
const large = 'https://jareds-file-sharing.s3.amazonaws.com/jared_on_stuff.jpeg';

let imgPath = large;

export class About extends React.Component {
    getDimensions = () => {
        let width = window.innerWidth;
        if (width <= 414) {
            return small;
        } else if (width <= 768) {
            return medium;
        } else {
            return large;
        }
    }

    render() {
        imgPath = this.getDimensions()
        return (
            <div>
                <ParallaxBanner
                    className=""
                    layers={[
                        {
                            image: imgPath,
                            amount: 0.1,
                        },
                    ]}
                    style={{
                        height: '600px',
                    }}
                >
                </ParallaxBanner>
                <h2>I'm Jared. I make things on the internet.</h2>
                <p className="about-desc">I'm currently a Senior Consultant and Lead Developer at Arup, where I lead a small
                    team of junior developers, deliver solutions across the development stack, and help drive the direction
                    of digital in the Americas. I love podcasts, running in Central Park, reading too much sci-fi, and
                    hiking to stand on top of tall things.</p>
            </div>

        )
    }
}
