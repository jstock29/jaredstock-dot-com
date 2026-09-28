import "./Project.scss";
import React from "react";
import { Link } from "react-router-dom";
import { Box, Grid } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LaunchIcon from "@mui/icons-material/Launch";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";

export function Project(props) {
  const [projectRef, isVisible] = useRevealOnScroll();
  const itemClassName = `project-item ${isVisible ? "project-item-visible" : ""}`;

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
          <Link to={props.to} className="link-icon">
            <h2 className={"project-heading"}>{props.title}</h2>
          </Link>
          <p className="project-desc">{props.text}</p>
          {props.github && (
            <a
              href={props.github}
              target="_blank"
              rel="noreferrer"
              className="link-icon"
              aria-label={`${props.title} on GitHub`}
            >
              <GitHubIcon style={{ fontSize: 20 }} />
            </a>
          )}
          {props.link && (
            <a
              href={props.link}
              target="_blank"
              rel="noreferrer"
              className="link-icon"
              aria-label={`Visit ${props.title}`}
            >
              <LaunchIcon style={{ fontSize: 20 }} />
            </a>
          )}
        </div>
        <div>
          <Box>
            <Link to={props.to}>
              <img
                src={props.image}
                className="project-image responsive"
                alt={props.title}
                loading="lazy"
              ></img>
            </Link>
          </Box>
          <Link to={props.to} className="project-read-more">
            read more →
          </Link>
        </div>
      </Grid>
    </div>
  );
}
