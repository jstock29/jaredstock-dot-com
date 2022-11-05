import React from 'react';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import { makeStyles } from '@mui/styles';
import TimelineDot from '@mui/lab/TimelineDot';
import { TimelineOppositeContent } from "@mui/lab";
import { Typography } from "@mui/material";
import './WorkTimelineItem.scss'

const useStyles = makeStyles((theme) => ({
    MuiTimelineConnector: {
        backgroundColor: theme.palette.neutral.main
    },
    TimelineDot: {
        backgroundColor: theme.palette.neutral.main
    },
    TimelineContent: {
        textAlign: "initial",
        color: theme.palette.neutral.main,
        minWidth: "100px",
    }
}));


export function WorkTimelineItem(props) {
    const classes = useStyles();
    if (!props.last) {
        return (
            <TimelineItem>
                <TimelineOppositeContent>
                    <Typography color="textSecondary">{props.date}</Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot color={props.color} />
                    <TimelineConnector className={classes.MuiTimelineConnector} />
                </TimelineSeparator>
                <TimelineContent className={classes.TimelineContent}>{props.text}</TimelineContent>
            </TimelineItem>
        )
    } else {
        return (
            <TimelineItem>
                <TimelineOppositeContent>
                    <Typography color="textSecondary">{props.date}</Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot color={props.color} />
                </TimelineSeparator>
                <TimelineContent className={classes.TimelineContent}>{props.text}</TimelineContent>
            </TimelineItem>
        )
    }
};
