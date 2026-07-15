import React, { useEffect, useRef, useState, useMemo } from "react";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import { TimelineOppositeContent } from "@mui/lab";
import { Typography } from "@mui/material";
import "./WorkTimelineItem.scss";

// ─── Color map ─────────────────────────────────────────────────────────────────
// References CSS custom properties defined in colors.scss :root block —
// single source of truth, no duplicated hex values here.
const COLOR_MAP = {
  blue:           "var(--navy)",
  blueLight:      "var(--navy-light)",
  gold:           "var(--gold)",
  goldLight:      "var(--gold-light)",
  primary:        "var(--navy)",
  secondary:      "var(--gold)",
  warning:        "var(--warning)",
  info:           "var(--navy-bold)",
  inherit:        "var(--neutral-gray)",
};

// ─── Shape definitions (all inscribed in the same radius) ─────────────────────
const RADIUS = 8;
const SHAPES = ["circle", "diamond", "triangle", "hexagon"]

function getShapePath(shape) {
  const r = RADIUS;
  switch (shape) {
    case "circle":
      return null; // rendered as <circle>
    case "diamond": {
      // rotated square
      return `M 0,${-r} L ${r},0 L 0,${r} L ${-r},0 Z`;
    }
    case "triangle": {
      const pts = [0, 1, 2].map((i) => {
        const a = (Math.PI * 2 * i) / 3 - Math.PI / 2;
        return `${r * Math.cos(a)},${r * Math.sin(a)}`;
      });
      return `M ${pts.join(" L ")} Z`;
    }
    case "pentagon": {
      const pts = [0, 1, 2, 3, 4].map((i) => {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
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
    default:
      return null;
  }
}

// Seeded "random" from index so shape is stable per item (no re-render flicker)
function shapeForIndex(i) {
  return SHAPES[i % SHAPES.length];
}

// ─── SVG Shape Bullet ──────────────────────────────────────────────────────────
function ShapeBullet({ shape, color, isVisible }) {
  const fill = COLOR_MAP[color] || COLOR_MAP.primary;
  const size = (RADIUS + 4) * 2;
  const path = getShapePath(shape);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-RADIUS - 4} ${-RADIUS - 4} ${size} ${size}`}
      className={`shape-bullet ${isVisible ? "shape-bullet-visible" : ""}`}
      style={{ overflow: "visible", flexShrink: 0 }}
    >
      {path ? (
        <path d={path} fill={fill} />
      ) : (
        <circle cx={0} cy={0} r={RADIUS} fill={fill} />
      )}
    </svg>
  );
}

// ─── WorkTimelineItem ──────────────────────────────────────────────────────────
export function WorkTimelineItem(props) {
  const [isVisible, setIsVisible] = useState(false);
  const timelineItemRef = useRef(null);
  const shape = useMemo(() => shapeForIndex(props.pos), [props.pos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { root: null, rootMargin: "0px", threshold: 0.1 }
    );
    if (timelineItemRef.current) observer.observe(timelineItemRef.current);
    return () => {
      if (timelineItemRef.current) observer.unobserve(timelineItemRef.current);
    };
  }, []);

  const itemClassName = `work-timeline-item ${isVisible ? "work-timeline-item-visible" : ""}`;

  const bullet = (
    <ShapeBullet shape={shape} color={props.color} isVisible={isVisible} />
  );

  const separator = (
    <TimelineSeparator>
      {bullet}
      {!props.last && <TimelineConnector sx={{ bgcolor: "neutral.main" }} />}
    </TimelineSeparator>
  );

  return (
    <TimelineItem ref={timelineItemRef} className={itemClassName}>
      <TimelineOppositeContent>
        <Typography color="text.secondary">{props.date}</Typography>
      </TimelineOppositeContent>
      {separator}
      <TimelineContent
        sx={{ textAlign: "initial", color: "neutral.main", minWidth: "100px" }}
      >
        {props.text}
      </TimelineContent>
    </TimelineItem>
  );
}
