import { motion } from "framer-motion";

const triangleVariants = {
  initial: { y: 0, scale: 1 },
  animate: {
    y: [0, -18, 8, 0],
    scale: [1, 1.06, 0.96, 1],
    transition: {
      y: {
        repeat: Infinity,
        duration: 3,
        ease: "easeInOut",
      },
      scale: {
        repeat: Infinity,
        duration: 3,
        ease: "easeInOut",
      },
    },
  },
};

export const EntryPointer = () => {
  return (
    <motion.div
      className="pointer"
      initial="initial"
      animate="animate"
      transition={{
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }}
    >
      <svg
        version="1.1"
        x="0px"
        y="0px"
        viewBox="-16.5 0 200 299"
        className="pointer-svg"
      >
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
  );
};
