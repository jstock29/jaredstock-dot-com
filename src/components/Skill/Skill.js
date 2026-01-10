import "./Skill.scss";
import { Chip } from "@mui/material";
import { motion } from "framer-motion"; // Import motion

export function Skill(props) {
  const chipClassName =
    props.color === "primary"
      ? "skill-chip-primary"
      : props.color === "secondary"
        ? "skill-chip-secondary"
        : "skill-chip";

  // Define animation variants for sliding in sequentially from the right
  const skillVariants = {
    hidden: { opacity: 0, x: 50 }, // Start off-screen to the right and invisible
    visible: (i) => ({
      opacity: 1,
      x: 0, // Slide to original position
      transition: {
        delay: props.parentIsVisible ? i * 0.05 : 0, // Staggered delay only when parent is visible
        duration: 0.4,
        ease: "easeOut",
      },
    }),
    exit: { opacity: 0, scale: 0.8 }, // Keep existing exit animation for filtering
  };

  return (
    <motion.div
      layout
      variants={skillVariants}
      initial="hidden"
      // Animate to 'visible' when parentIsVisible is true, otherwise stay 'hidden'
      animate={props.parentIsVisible ? "visible" : "hidden"}
      exit="exit"
      custom={props.pos} // Pass the position as a custom prop for staggered animation
    >
      <Chip label={props.label} className={chipClassName} />
    </motion.div>
  );
}
