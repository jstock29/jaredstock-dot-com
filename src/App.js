import './App.scss';
import {Parallax, ParallaxProvider} from 'react-scroll-parallax';
import React from "react";
import {Scroll} from "./components/Scroll/Scroll";
import {Project} from "./components/Project/Project";
import {WorkTimeline} from "./components/WorkTimeline/WorkTimeline";
import {Publication} from "./components/Publication/Publication";
import {About} from "./components/About/About";
import {Skill} from "./components/Skill/Skill";
import {Grid} from "@material-ui/core";
import {Description} from "@material-ui/icons";

const projects = [
    {
        title: 'Social Data',
        text: "I'm leading the development of an open source app and open data for a variety of social datasets in the US.",
        image: 'https://jareds-file-sharing.s3.amazonaws.com/social-data.png',
        link: 'https://share.streamlit.io/arup-group/social-data/run.py',
        github: 'https://github.com/arup-group/social-data'
    },
    {
        title: 'Deal or No Deal',
        text: "I watched over 100 episodes of Deal or No Deal to conduct this analysis of the greatest game show of all time.",
        image: 'https://jareds-file-sharing.s3.amazonaws.com/tds.png',
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
        text: "Another joke website I made for my friend's birthday, only even weirder somehow.",
        image: 'https://jareds-file-sharing.s3.amazonaws.com/bba.png',
        link: 'https://bigballsannie.com/',
        github: 'https://github.com/jstock29/bigballsannie-dot-com'
    },
]

const work = [
    {
        date: 'May 2016',
        text: 'Graduated University of Colorado - Boulder',
        color: 'primary'
    },
    {
        date: 'June 2016',
        text: 'Start at Arup New York',
        color: 'primary'
    },
    {
        date: 'December 2018',
        text: 'Deliver genetic optimization of building energy models for NRDC',
        color: 'secondary'
    },
    {
        date: 'November 2019',
        text: 'Present at World Engineering Conference Melbourne',
        color: 'secondary'
    },
    {
        date: 'May 2020',
        text: 'Lead pro-bono open source eviction work',
        color: 'secondary'
    },
    {
        date: 'April 2021',
        text: 'Promoted to Lead Developer',
        color: 'primary'
    },
]

const publications = [
    {
        title: 'Eviction Analysis',
        text: 'Medium',
        image: 'https://jareds-file-sharing.s3.amazonaws.com/tds.png',
        link: 'https://medium.com/arup-digital-news/an-open-source-approach-to-preventing-evictions-5ed4ad5daea6',
    },
    {
        title: 'Deal or No Deal',
        text: 'Medium',
        image: 'https://jareds-file-sharing.s3.amazonaws.com/tds.png',
        link: 'https://towardsdatascience.com/i-figured-out-how-deal-or-no-deal-works-kind-of-875e63a8cef6',
    },
    {
        title: 'Streamlit',
        text: 'blog.streamlit.io',
        image: 'https://jareds-file-sharing.s3.amazonaws.com/streamlit-blog.png',
        link: 'https://blog.streamlit.io/open-source-eviction-data/',
    }
]

const skills = [
    {label: 'Python', color: 'primary'},
    {label: 'Streamlit', color: 'secondary'},
    {label: 'Data Analysis', color: 'primary'},
    {label: 'Data Science', color: 'secondary'},
    {label: 'Genetic Algorithms', color: 'secondary'},
    {label: 'Javascript', color: 'primary'},
    {label: 'CSS', color: 'primary'},
    {label: 'HTML', color: 'primary'},
    {label: 'Typescript', color: 'primary'},
    {label: 'Angular', color: 'primary'},
    {label: 'React', color: 'primary'},
    {label: 'SQL', color: 'primary'},
    {label: 'PostgreSQL', color: 'secondary'},
    {label: 'Devops', color: 'primary'},
    {label: 'Git', color: 'secondary'},
    {label: 'Docker', color: 'primary'},
    {label: 'Serverless', color: 'secondary'},
    {label: 'JSON', color: 'secondary'},
    {label: 'Amazon Web Services', color: 'primary'},
    {label: 'Google Cloud Platform', color: 'primary'},
    {label: 'Websockets', color: 'secondary'},
    {label: 'Linux', color: 'secondary'},
    {label: 'Agile', color: 'primary'},
    {label: 'Solution Architecture', color: 'primary'},
]

function App() {
    let projectsList = []
    let publicationList = []
    let skillsList = []

    for (let proj of projects) {
        projectsList.push(<Project title={proj.title} text={proj.text} image={proj.image} link={proj.link} key={proj.title}/>)
    }

    for (let pub of publications) {
        publicationList.push(<Publication title={pub.title} text={pub.text} image={pub.image} link={pub.link} key={pub.title}/>)
    }

    for (let skill of skills) {
        skillsList.push(<Skill label={skill.label} color={skill.color} key={skill.label}/>)
    }

    return (
        <div>
            <div className="anchors">
                <div>
                    <a href="#about"><h5>About</h5></a>
                </div>
                <div>
                    <a href="#projects"><h5>Projects</h5></a>
                </div>
                <div>
                    <a href="#publications"><h5>Publications</h5></a>
                </div>
                <div>
                    <a href="#work"><h5>Work</h5></a>
                </div>
            </div>
            <ParallaxProvider>
                <div className="App">
                    <Scroll/>
                    <div className="about" id="about">
                        <Parallax y={[-20, 20]}>
                            <h1 className="section-title">ABOUT</h1>
                        </Parallax>
                        <About></About>
                    </div>
                    <div className="projects" id="projects">
                        <Parallax y={[-20, 20]} tagOuter="figure">
                            <h1 className="section-title">PROJECTS</h1>
                        </Parallax>
                        {projectsList}
                    </div>
                    <div className="publications" id="publications">
                        <Parallax y={[-20, 20]} tagOuter="figure">
                            <h1 className="section-title">PUBLICATIONS</h1>
                        </Parallax>
                        {publicationList}
                    </div>
                    <div className="work" id="work">
                        <Parallax y={[-20, 20]} tagOuter="figure">
                            <h1 className="section-title">WORK</h1>
                            <a href='https://jareds-file-sharing.s3.amazonaws.com/Jared+Stock+Resume.pdf' target="_blank" rel="noreferrer" className="link">
                                <h4 className={'resume'}>Resume</h4>
                            </a>
                            <WorkTimeline work={work}/>
                            <Grid
                                container
                                direction="row"
                                justify="space-evenly"
                                alignItems="center"
                                className={'project'}
                                >
                                {skillsList}
                            </Grid>
                        </Parallax>
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
