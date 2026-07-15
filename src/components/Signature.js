import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

const SHAPES = ["square", "diamond", "triangle", "hexagon"];
const COLORS = ["blue", "blueLight", "gold", "goldLight"];

// Re-using logic from WorkTimelineItem, but simplified for static display
const RADIUS = 10;
function getShapePath(shape) {
  const r = RADIUS;
  switch (shape) {
    case "square": return `M ${-r},${-r} L ${r},${-r} L ${r},${r} L ${-r},${r} Z`;
    case "diamond": return `M 0,${-r} L ${r},0 L 0,${r} L ${-r},0 Z`;
    case "triangle": {
      const pts = [0, 1, 2].map((i) => {
        const a = (Math.PI * 2 * i) / 3 - Math.PI / 2;
        return `${r * Math.cos(a)},${r * Math.sin(a)}`;
      });
      return `M ${pts.join(" L ")} Z`;
    }
    case "hexagon": {
      const pts = [0, 1, 2, 3, 4, 5].map((i) => {
        const a = (Math.PI * 2 * i) / 6;
        return `${r * Math.cos(a)},${r * Math.sin(a)}`;
      });
      return `M ${pts.join(" L ")} Z`;
    }
    default: return null;
  }
}

// Maps directly to CSS custom properties
const COLOR_MAP = {
  blue:      "var(--navy)",
  blueLight: "var(--navy-light)",
  gold:      "var(--gold)",
  goldLight: "var(--gold-light)",
};

export function Signature() {
  const signatureItems = React.useMemo(() => {
    let items = [];
    SHAPES.forEach((s, i) => {
        items.push({ shape: s, color: COLORS[i] });
    });
    return items.sort(() => Math.random() - 0.5);
  }, []);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, py: 2, mb: 1 }}>
      {signatureItems.map((item, i) => (
        <motion.div
            key={i}
            whileHover={{ rotate: 360 }}
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
            style={{ display: 'flex', cursor: 'pointer' }}
        >
            <svg width={RADIUS * 2} height={RADIUS * 2} viewBox={`${-RADIUS} ${-RADIUS} ${RADIUS * 2} ${RADIUS * 2}`}>
                <path d={getShapePath(item.shape)} fill={COLOR_MAP[item.color]} />
            </svg>
        </motion.div>
      ))}
    </Box>
  );
}
