import "./Skill.scss";
import { Chip } from "@mui/material";
import { motion } from "framer-motion"; // Import motion

export function Skill(props) {
  if (props.color === "primary") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <Chip label={props.label} className={"skill-chip-primary"} />
      </motion.div>
    );
  } else if (props.color === "secondary") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <Chip label={props.label} className={"skill-chip-secondary"} />
      </motion.div>
    );
  } else {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <Chip label={props.label} className={"skill-chip"} />
      </motion.div>
    );
  }
}
