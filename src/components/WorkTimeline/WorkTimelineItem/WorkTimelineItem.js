import React from 'react';
import TimelineItem from '@material-ui/lab/TimelineItem';
import TimelineSeparator from '@material-ui/lab/TimelineSeparator';
import TimelineConnector from '@material-ui/lab/TimelineConnector';
import TimelineContent from '@material-ui/lab/TimelineContent';
import {makeStyles} from "@material-ui/core/styles";
import TimelineDot from '@material-ui/lab/TimelineDot';
import {TimelineOppositeContent} from "@material-ui/lab";
import {Typography} from "@material-ui/core";
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
        minWidth:"100px",
    }
}));


export function WorkTimelineItem(props) {
    const classes = useStyles();
    if (!props.last){
        return (
            <TimelineItem>
                <TimelineOppositeContent>
                    <Typography color="textSecondary">{props.date}</Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot color={props.color}/>
                    <TimelineConnector className={classes.MuiTimelineConnector}/>
                </TimelineSeparator>
                <TimelineContent className={classes.TimelineContent}>{props.text}</TimelineContent>
            </TimelineItem>
        )
    }else {
        return (
            <TimelineItem>
                <TimelineOppositeContent>
                    <Typography color="textSecondary">{props.date}</Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot color={props.color}/>
                </TimelineSeparator>
                <TimelineContent className={classes.TimelineContent}>{props.text}</TimelineContent>
            </TimelineItem>
        )
    }
};
