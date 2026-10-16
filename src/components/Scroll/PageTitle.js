import { motion } from "framer-motion";
import { Grid } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { useRef } from "react";

const titleVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

export const PageTitle = ({ name, links = {} }) => {
  const heroRef = useRef(null);

  const scrollToAbout = () => {
    if (heroRef.current) {
      const aboutEl = document.getElementById("about");
      if (aboutEl) {
        aboutEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="page-title" ref={heroRef}>
      <motion.h1
        className="title"
        variants={titleVariants}
        initial="initial"
        animate="animate"
        style={{ cursor: "pointer" }}
        onClick={scrollToAbout}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {name}
      </motion.h1>
      <Grid
        container
        direction="row"
        justifyContent="space-evenly"
        alignItems="center"
        className="links-grid"
      >
        {links.github && (
          <a href={links.github} title="Github" target="_blank" rel="noreferrer" className="link-icon">
            <GitHubIcon style={{ fontSize: 26 }} />
          </a>
        )}
        {links.linkedin && (
          <a href={links.linkedin} title="LinkedIn" target="_blank" rel="noreferrer" className="link-icon">
            <LinkedInIcon style={{ fontSize: 26 }} />
          </a>
        )}
        {links.email && (
          <a href={`mailto:${links.email}`} title="Email" className="link-icon">
            <EmailOutlinedIcon style={{ fontSize: 26 }} />
          </a>
        )}
      </Grid>
    </div>
  );
};
