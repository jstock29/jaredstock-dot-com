import React from "react";
import Timeline from "@mui/lab/Timeline";
import "./WorkTimeline.scss";
import { WorkTimelineItem } from "./WorkTimelineItem/WorkTimelineItem";

export function WorkTimeline(props) {
  const timelineList = props.work.map((data, i) => (
    <WorkTimelineItem
      text={data.text}
      date={data.date}
      color={data.color}
      pos={i}
      key={i}
      last={i === props.work.length - 1}
    />
  ));

  return <Timeline className={"timeline"}>{timelineList}</Timeline>;
}
