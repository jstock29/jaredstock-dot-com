import React, { useEffect, useRef, useState } from "react";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import { TimelineOppositeContent } from "@mui/lab";
import { Typography } from "@mui/material";
import "./WorkTimelineItem.scss";

export function WorkTimelineItem(props) {
  const [isVisible, setIsVisible] = useState(false);
  const timelineItemRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1, // Trigger when 10% of the item is visible
      },
    );

    if (timelineItemRef.current) {
      observer.observe(timelineItemRef.current);
    }

    return () => {
      if (timelineItemRef.current) {
        observer.unobserve(timelineItemRef.current);
      }
    };
  }, []);

  const itemClassName = `work-timeline-item ${isVisible ? "work-timeline-item-visible" : ""}`;

  if (!props.last) {
    return (
      <TimelineItem ref={timelineItemRef} className={itemClassName}>
        <TimelineOppositeContent>
          <Typography color="text.secondary">{props.date}</Typography>
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color={props.color} />
          <TimelineConnector sx={{ bgcolor: "neutral.main" }} />
        </TimelineSeparator>
        <TimelineContent
          sx={{
            textAlign: "initial",
            color: "neutral.main",
            minWidth: "100px",
          }}
        >
          {props.text}
        </TimelineContent>
      </TimelineItem>
    );
  } else {
    return (
      <TimelineItem ref={timelineItemRef} className={itemClassName}>
        <TimelineOppositeContent>
          <Typography color="text.secondary">{props.date}</Typography>
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color={props.color} />
        </TimelineSeparator>
        <TimelineContent
          sx={{
            textAlign: "initial",
            color: "neutral.main",
            minWidth: "100px",
          }}
        >
          {props.text}
        </TimelineContent>
      </TimelineItem>
    );
  }
}
