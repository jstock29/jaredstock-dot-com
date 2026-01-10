import "./Scroll.scss";
import { Grid } from "@mui/material";
import { motion } from "framer-motion";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import TwitterIcon from "@mui/icons-material/Twitter";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

export const Scroll = () => {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.5, // Stagger animation of children for a more deliberate rhythm
        delayChildren: 0.25, // Start animation immediately
      },
    },
  };

  const triangleVariants = {
    initial: { y: 0, scale: 1 },
    animate: {
      y: [0, -25, 10, 0], // Individual bounce
      scale: [1, 1.03, 0.98, 1], // Individual pulse
      transition: {
        y: {
          repeat: Infinity,
          duration: 1.8, // Snappier bounce
          ease: "easeInOut",
        },
        scale: {
          repeat: Infinity,
          duration: 1.8, // Snappier pulse
          ease: "easeInOut",
        },
      },
    },
  };

  return (
    <div className="scroll">
      <h1 className="title">jared stock</h1>
      <motion.div
        className="pointer"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <svg version="1.1" x="0px" y="0px" viewBox="-16.5 0 200 299">
          <motion.polygon
            className="fill-1"
            points="167,50 83.5,270 0,50 "
            variants={triangleVariants}
          />
          <motion.polygon
            className="fill-2"
            points="137.4,0 83.5,145.9 29.6,0 "
            variants={triangleVariants}
          />
        </svg>
      </motion.div>
      <Grid
        container
        direction="row"
        justifyContent="space-evenly"
        alignItems="center"
      >
        <a
          href="https://github.com/jstock29"
          title="Github"
          target="_blank"
          rel="noreferrer"
          className="link-icon"
        >
          <GitHubIcon style={{ fontSize: 26 }} />
        </a>
        <a
          href="https://www.linkedin.com/in/jaredstock/"
          title="LinkedIn"
          target="_blank"
          rel="noreferrer"
          className="link-icon"
        >
          <LinkedInIcon style={{ fontSize: 26 }} />
        </a>
        <a
          href="mailto:jstock529@gmail.com"
          title="Email"
          target="_blank"
          rel="noreferrer"
          className="link-icon"
        >
          <EmailOutlinedIcon style={{ fontSize: 26 }} />
        </a>
      </Grid>
    </div>
  );
};
