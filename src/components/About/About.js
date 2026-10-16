import React from "react";
import Markdown from "react-markdown";
import "./About.scss";

const linkComponents = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" className="link" />,
};

export function About({ about }) {
  return (
    <div>
      {about.photo && (
        <div
          role="img"
          aria-label={about.heading}
          style={{
            backgroundImage: `url(${about.photo})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "400px",
            width: "100%",
            borderRadius: "16px",
            margin: "0 auto 24px auto",
            maxWidth: "800px",
            boxShadow: "0 4px 24px rgba(9, 48, 107, 0.15)",
          }}
        ></div>
      )}
      <h2>{about.heading}</h2>
      <div className="about-desc">
        <Markdown components={linkComponents}>{about.body}</Markdown>
      </div>
    </div>
  );
}
