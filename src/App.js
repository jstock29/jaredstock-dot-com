import './App.scss';
import { Parallax, ParallaxProvider } from 'react-scroll-parallax';
import React from "react";
import { Scroll } from "./components/Scroll/Scroll";
import { Project } from "./components/Project/Project";
import { WorkTimeline } from "./components/WorkTimeline/WorkTimeline";
import { Publication } from "./components/Publication/Publication";
import { About } from "./components/About/About";
import { Skill } from "./components/Skill/Skill";
import { Chip, Grid, Hidden } from "@mui/material";

const projects = [
    {
        title: 'Social Data',
        text: "I led the development of an open source app and open data for a variety of social datasets in the US.",
        image: 'https://jareds-file-sharing.s3.amazonaws.com/social-data.png',
        link: 'https://share.streamlit.io/arup-group/social-data/run.py',
        github: 'https://github.com/arup-group/social-data'
    },
    {
        title: 'Deal or No Deal',
        text: "I watched over 100 episodes of Deal or No Deal to conduct this analysis of the greatest game show of all time.",
        image: 'https://jareds-file-sharing.s3.amazonaws.com/dond-interface.png',
        link: 'https://share.streamlit.io/jstock29/dealnodeal/main/app.py',
        github: 'https://github.com/jstock29/dealnodeal'
    },
    {
        title: 'Teetum.com',
        text: "I made a website for my friend's birthday as joke. You won't get the jokes.",
        image: 'https://jareds-file-sharing.s3.amazonaws.com/teetum.png',
        link: 'https://teetum.com/',
        github: 'https://github.com/jstock29/teetum-dot-com'
    },
    {
        title: 'Bigballsannie.com',
        text: "I made yet another joke website for my friend's birthday, only even weirder somehow.",
        image: 'https://jareds-file-sharing.s3.amazonaws.com/bba.png',
        link: 'https://bigballsannie.com/',
        github: 'https://github.com/jstock29/bigballsannie-dot-com'
    },
]

const work = [
    {
        date: '2016',
        text: 'Graduated University of Colorado - Boulder',
        color: 'primary'
    },
    {
        date: '2016',
        text: 'Started at Arup New York',
        color: 'primary'
    },
    {
        date: '2018',
        text: 'Delivered genetic optimization of energy models for NRDC',
        color: 'primary'
    },
    {
        date: '2019',
        text: 'Presented at World Engineering Conference Melbourne',
        color: 'primary'
    },
    {
        date: '2020',
        text: 'Led pro-bono open source eviction work',
        color: 'primary'
    },
    {
        date: '2021',
        text: 'Promoted to Lead Developer',
        color: 'primary'
    },
    {
        date: '2021',
        text: 'Delivered district energy modeling platfrom on Google Cloud Platform',
        color: 'primary'
    },
    {
        date: '2022',
        text: 'Joined Thoughtworks as a Senior Developer',
        color: 'primary'
    },
]

const publications = [
    {
        title: 'I figured out how Deal or No Deal works (kind of)',
        text: 'Towards Data Science',
        image: 'https://jareds-file-sharing.s3.amazonaws.com/tds.png',
        link: 'https://towardsdatascience.com/i-figured-out-how-deal-or-no-deal-works-kind-of-875e63a8cef6',
    },
    {
        title: 'How data can prevent pandemic-related homelessness',
        text: 'Arup.com',
        image: 'https://jareds-file-sharing.s3.amazonaws.com/arupdotcom.png',
        link: 'https://www.arup.com/perspectives/how-data-can-prevent-pandemic-related-homelessness',
    },
    {
        title: 'Arup and New Story use data to help combat pandemic related evictions',
        text: 'Streamlit Community Blog',
        image: 'https://jareds-file-sharing.s3.amazonaws.com/streamlit-blog.png',
        link: 'https://blog.streamlit.io/open-source-eviction-data/',
    },
    {
        title: 'An open source approach to preventing evictions',
        text: 'Arup Digital News | Medium',
        image: 'https://jareds-file-sharing.s3.amazonaws.com/arup-digital.png',
        link: 'https://medium.com/arup-digital-news/an-open-source-approach-to-preventing-evictions-5ed4ad5daea6',
    },
]

const skills = [
    { label: 'Python', color: 'primary' },
    { label: 'Streamlit', color: 'secondary' },
    { label: 'Data Analysis', color: 'default' },
    { label: 'Data Science', color: 'default' },
    { label: 'Machine Learning', color: 'default' },
    { label: 'Genetic Algorithms', color: 'default' },
    { label: 'Javascript', color: 'primary' },
    { label: 'Typescript', color: 'primary' },
    { label: 'HTML', color: 'primary' },
    { label: 'CSS', color: 'primary' },
    { label: 'Angular', color: 'secondary' },
    { label: 'NGRX', color: 'secondary' },
    { label: 'React', color: 'secondary' },
    { label: 'Node.js', color: 'secondary' },
    { label: 'SQL', color: 'primary' },
    { label: 'PostgreSQL', color: 'secondary' },
    { label: 'Devops', color: 'default' },
    { label: 'Git', color: 'secondary' },
    { label: 'Docker', color: 'secondary' },
    { label: 'Serverless', color: 'secondary' },
    { label: 'JSON', color: 'secondary' },
    { label: 'Amazon Web Services', color: 'secondary' },
    { label: 'Google Cloud Platform', color: 'secondary' },
    { label: 'Websockets', color: 'default' },
    { label: 'Parallel Programming', color: 'default' },
    { label: 'Linux', color: 'secondary' },
    { label: 'Agile', color: 'default' },
    { label: 'Solution Architecture', color: 'default' },
    { label: 'Responsive Design', color: 'default' },
    { label: 'Bash', color: 'primary' },
    { label: 'MongoDB', color: 'secondary' },
]

function App() {
    let projectsList = []
    let publicationList = []
    let skillsList = []

    for (let [i, proj] of projects.entries()) {
        if (i % 2 === 0) {
            projectsList.push(<Project title={proj.title} text={proj.text} image={proj.image} link={proj.link}
                key={proj.title} alternate={false} />)
        } else {
            projectsList.push(<Project title={proj.title} text={proj.text} image={proj.image} link={proj.link}
                key={proj.title} alternate={true} />)
        }
    }

    for (let [i, pub] of publications.entries()) {
        if (i % 2 === 0) {
            publicationList.push(<Publication title={pub.title} text={pub.text} image={pub.image} link={pub.link}
                key={pub.title} alternate={false} />)
        } else {
            publicationList.push(<Publication title={pub.title} text={pub.text} image={pub.image} link={pub.link}
                key={pub.title} alternate={true} />)
        }
    }

    for (let skill of skills.sort((a, b) => (a.label > b.label) ? 1 : -1)) {
        skillsList.push(<Skill label={skill.label} color={skill.color} key={skill.label} />)
    }

    return (
        <div>
            <Hidden smDown>
                <div className="anchors">
                    <div>
                        <a href="#about"><h5>About</h5></a>
                    </div>
                    <div>
                        <a href="#work"><h5>Experience</h5></a>
                    </div>
                    <div>
                        <a href="#projects"><h5>Projects</h5></a>
                    </div>
                    <div>
                        <a href="#publications"><h5>Publications</h5></a>
                    </div>
                </div>
            </Hidden>
            <ParallaxProvider>
                <div className="App">
                    <Scroll />
                    <div className="about" id="about">
                        {/*<Parallax y={[-20, 20]}>*/}
                        {/*<h1 className="section-title">ABOUT</h1>*/}
                        {/*</Parallax>*/}
                        <About></About>
                    </div>
                    <div className="work" id="work">
                        <Parallax y={[-10, 10]} tagOuter="figure">
                            <h1 className="section-title">EXPERIENCE</h1>
                        </Parallax>
                        <Parallax y={[-10, 10]} tagOuter="figure">
                            <WorkTimeline work={work} />
                        </Parallax>
                        <Parallax y={[-10, 10]} tagOuter="figure">
                            <Grid container direction="row" className={'skills-legend'}>
                                <Chip size="small" label={'Languages'} className={'category-1'} />
                                <Chip size="small" label={'Frameworks + Tools'} className={'category-2'} />
                                <Chip size="small" label={'Skills'} className={'category-3'} />
                            </Grid>
                            <Grid container direction="row" justify="space-evenly" alignItems="center" className={'skills-grid'}>
                                {skillsList}
                            </Grid>
                            <a href='https://jareds-file-sharing.s3.amazonaws.com/Jared+Stock+Resume.pdf'
                                target="_blank" rel="noreferrer" className="link">
                                <h4 className={'resume'}>Resume</h4>
                            </a>
                        </Parallax>
                    </div>
                    <div className="projects" id="projects">
                        <Parallax y={[-10, 10]} tagOuter="figure">
                            <h1 className="section-title">PROJECTS</h1>
                        </Parallax>
                        <Grid container direction="column" justify="space-evenly" alignItems="center" >
                            {projectsList}
                        </Grid>
                    </div>
                    <div className="publications" id="publications">
                        <Parallax y={[-10, 10]} tagOuter="figure">
                            <h1 className="section-title">PUBLICATIONS</h1>
                        </Parallax>
                        <Grid container direction="column" justify="space-evenly" alignItems="center" >
                            {publicationList}
                        </Grid>
                    </div>
                    <footer className={'footer'}>
                        Jared Stock | 2021 | NYC
                    </footer>
                </div>
            </ParallaxProvider>
        </div>
    );
}

export default App;
