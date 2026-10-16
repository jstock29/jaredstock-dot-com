import "./Publication.scss";
import React from "react";
import { Link } from "react-router-dom";
import { Box, Grid } from "@mui/material";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";

// A publication with its own page links there; otherwise straight to the article.
function PublicationLink({ to, href, children, ...rest }) {
  if (to) {
    return (
      <Link to={to} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" {...rest}>
      {children}
    </a>
  );
}

export function Publication(props) {
  const [publicationRef, isVisible] = useRevealOnScroll();
  const itemClassName = `publication-item ${isVisible ? "publication-item-visible" : ""}`;
  const linkProps = { to: props.to, href: props.link };

  return (
    <div ref={publicationRef} className={itemClassName}>
      <Grid
        container
        direction={{ xs: "column", md: "row" }}
        justifyContent={{ xs: "center", md: "space-evenly" }}
        alignItems="center"
        className={"publication"}
      >
        <div className={"content"}>
          <PublicationLink {...linkProps} className="link-icon">
            <h2 className={"article-title"}>{props.title}</h2>
          </PublicationLink>
          <p className={"publisher"}>{props.text}</p>
        </div>
        {props.image && (
          <div>
            <Box>
              <PublicationLink {...linkProps}>
                <img src={props.image} className="pub-image responsive" alt={props.title} loading="lazy" />
              </PublicationLink>
            </Box>
          </div>
        )}
      </Grid>
    </div>
  );
}
