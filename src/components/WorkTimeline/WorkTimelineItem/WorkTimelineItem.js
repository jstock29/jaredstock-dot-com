import React from 'react';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { TimelineOppositeContent } from "@mui/lab";
import { Typography } from "@mui/material";
import './WorkTimelineItem.scss'

export function WorkTimelineItem(props) {
    if (!props.last) {
        return (
            <TimelineItem>
                <TimelineOppositeContent>
                    <Typography color="text.secondary">{props.date}</Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot color={props.color} />
                    <TimelineConnector sx={{ bgcolor: 'neutral.main' }} />
                </TimelineSeparator>
                <TimelineContent sx={{ textAlign: 'initial', color: 'neutral.main', minWidth: '100px' }}>
                    {props.text}
                </TimelineContent>
            </TimelineItem>
        )
    } else {
        return (
            <TimelineItem>
                <TimelineOppositeContent>
                    <Typography color="text.secondary">{props.date}</Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot color={props.color} />
                </TimelineSeparator>
                <TimelineContent sx={{ textAlign: 'initial', color: 'neutral.main', minWidth: '100px' }}>
                    {props.text}
                </TimelineContent>
            </TimelineItem>
        )
    }
};
