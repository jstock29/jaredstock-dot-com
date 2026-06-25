import "./Project.scss";
import React, { useEffect, useRef, useState } from "react";
import { Box, Grid } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";

function isMobile() {
  let width = window.innerWidth;
  if (width <= 768) {
    return true;
  } else {
    return false;
  }
}

export function Project(props) {
  const [isVisible, setIsVisible] = useState(false);
  const projectRef = useRef(null);

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

    if (projectRef.current) {
      observer.observe(projectRef.current);
    }

    return () => {
      if (projectRef.current) {
        observer.unobserve(projectRef.current);
      }
    };
  }, []);

  const itemClassName = `project-item ${isVisible ? "project-item-visible" : ""}`;

  if (!isMobile()) {
    return (
      <div ref={projectRef} className={itemClassName}>
        <Grid
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
          className={"project"}
        >
          <div className={"content"}>
            <h2 className={"project-heading"}>{props.title}</h2>
            <p className="project-desc">{props.text}</p>
            {props.github && (
              <a
                href={props.github}
                target="_blank"
                rel="noreferrer"
                className="link-icon"
              >
                <GitHubIcon style={{ fontSize: 20 }} />
              </a>
            )}
            {/*<a href={props.link} target="_blank" rel="noreferrer" className="link-icon">*/}
            {/*    <Link style={{ fontSize: 20 }} />*/}
            {/*</a>*/}
          </div>
          <div>
            <Box>
              <a href={props.link} target="_blank" rel="noreferrer">
                <img
                  src={props.image}
                  className="project-image responsive"
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
      <div ref={projectRef} className={itemClassName}>
        <Grid
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
          className={"project"}
        >
          <div className={"content"}>
            <h2 className={"project-heading"}>{props.title}</h2>
            <p className="project-desc">{props.text}</p>
            {props.github && (
              <a
                href={props.github}
                target="_blank"
                rel="noreferrer"
                className="link-icon"
              >
                <GitHubIcon style={{ fontSize: 20 }} />
              </a>
            )}
            {/*<a href={props.link} target="_blank" rel="noreferrer" className="link-icon">*/}
            {/*    <Link style={{ fontSize: 20 }} />*/}
            {/*</a>*/}
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
