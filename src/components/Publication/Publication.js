import "./Publication.scss";
import React, { useEffect, useRef, useState } from "react";
import { Box, Grid } from "@mui/material";

function isMobile() {
  let width = window.innerWidth;
  if (width <= 768) {
    return true;
  } else {
    return false;
  }
}

export function Publication(props) {
  const [isVisible, setIsVisible] = useState(false);
  const publicationRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Stop observing once visible
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    if (publicationRef.current) {
      observer.observe(publicationRef.current);
    }

    return () => {
      if (publicationRef.current) {
        observer.unobserve(publicationRef.current);
      }
    };
  }, []);

  const itemClassName = `publication-item ${
    isVisible ? "publication-item-visible" : ""
  }`;

  if (!isMobile()) {
    return (
      <div ref={publicationRef} className={itemClassName}>
        <Grid
          container
          direction="row"
          justifyContent="space-evenly"
          alignItems="center"
          className={"publication"}
        >
          <div className={"content"}>
            <a
              href={props.link}
              target="_blank"
              rel="noreferrer"
              className="link-icon"
            >
              <h2>{props.title}</h2>
            </a>
            <p>
              {props.text}{" "}
              <a
                href={props.link}
                target="_blank"
                rel="noreferrer"
                className="link-icon"
              >
                {/*<Link style={{fontSize: 20}}/>*/}
              </a>
            </p>
          </div>
          <div>
            <Box>
              <a href={props.link} target="_blank" rel="noreferrer">
                <img
                  src={props.image}
                  className="pub-image responsive"
                  alt={props.title}
                ></img>
              </a>
            </Box>
          </div>
        </Grid>
      </div>
    );
  } else {
    return (
      <div ref={publicationRef} className={itemClassName}>
        <Grid
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
          className={"publication"}
        >
          <div className={"content"}>
            <a
              href={props.link}
              target="_blank"
              rel="noreferrer"
              className="link-icon"
            >
              <h2 className={"article-title"}>{props.title}</h2>
            </a>
            <p className={"publisher"}>
              {props.text}{" "}
              <a
                href={props.link}
                target="_blank"
                rel="noreferrer"
                className="link-icon"
              >
                {/*<Link style={{fontSize: 20}}/>*/}
              </a>
            </p>
          </div>
          <div>
            <Box>
              <a href={props.link} target="_blank" rel="noreferrer">
                <img
                  src={props.image}
                  className="responsive"
                  alt={props.title}
                ></img>
              </a>
            </Box>
          </div>
        </Grid>
      </div>
    );
  }
}
