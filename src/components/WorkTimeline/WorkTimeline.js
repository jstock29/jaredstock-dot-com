import React from 'react';
import {Parallax} from 'react-scroll-parallax';
import Timeline from '@material-ui/lab/Timeline';
import './WorkTimeline.scss'
import {WorkTimelineItem} from "./WorkTimelineItem/WorkTimelineItem";


export function WorkTimeline(props) {
    let timelineList = []

    for (const [i, data] of props.work.entries()) {
        if(i!==props.work.length-1){
            timelineList.push(<WorkTimelineItem text={data.text} date={data.date} color={data.color} pos={i} key={i} last={false}></WorkTimelineItem>)
        }else{
            timelineList.push(<WorkTimelineItem text={data.text} date={data.date} color={data.color} pos={i} key={i} last={true}></WorkTimelineItem>)
        }
    }
    return (
        // <Parallax y={[0, 0]}>
            <Timeline>
                {timelineList}
            </Timeline>
        // </Parallax>
    )
};
