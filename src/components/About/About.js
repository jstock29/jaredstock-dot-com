import React from "react";
import "./About.scss";

const small =
  "https://jareds-file-sharing.s3.amazonaws.com/jared_on_stuff_sq.jpg";
const medium =
  "https://jareds-file-sharing.s3.amazonaws.com/jared_on_stuff.jpeg";
const large =
  "https://jareds-file-sharing.s3.amazonaws.com/jared_on_stuff.jpeg";

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
  };

  render() {
    imgPath = this.getDimensions();
    return (
      <div>
        <div
          style={{
            backgroundImage: `url(${imgPath})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            // backgroundAttachment: 'fixed', // This creates the parallax-like effect
            height: "600px",
            width: "100%",
          }}
        ></div>
        <h2>i'm jared. i make things on the internet.</h2>
        <p className="about-desc">
          I'm a technologist everywhere and senior developer at{" "}
          <a
            href="https://www.thoughtworks.com/"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            Thoughtworks
          </a>
          . I love podcasts, running in Central Park, reading too much sci-fi,
          my cat, and hiking to stand on top of tall things. I can also tell you
          where to find the best bagel in New York.
        </p>
      </div>
    );
  }
}
