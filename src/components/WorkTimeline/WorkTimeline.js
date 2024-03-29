import React from 'react';
import Timeline from '@mui/lab/Timeline';
import './WorkTimeline.scss'
import { WorkTimelineItem } from "./WorkTimelineItem/WorkTimelineItem";


export function WorkTimeline(props) {
    let timelineList = []

    for (const [i, data] of props.work.entries()) {
        if (i !== props.work.length - 1) {
            timelineList.push(<WorkTimelineItem text={data.text} date={data.date} color={data.color} pos={i} key={i}
                last={false}></WorkTimelineItem>)
        } else {
            timelineList.push(<WorkTimelineItem text={data.text} date={data.date} color={data.color} pos={i} key={i}
                last={true}></WorkTimelineItem>)
        }
    }
    return (
        <Timeline className={'timeline'}>
            {timelineList}
        </Timeline>
    )
};
