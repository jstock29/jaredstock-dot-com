import "./App.scss";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence
import { Scroll } from "./components/Scroll/Scroll";
import { Project } from "./components/Project/Project";
import { WorkTimeline } from "./components/WorkTimeline/WorkTimeline";
import { Publication } from "./components/Publication/Publication";
import { About } from "./components/About/About";
import { Skill } from "./components/Skill/Skill";
import { Box, Chip, Grid } from "@mui/material";

const projects = [
  {
    title: "social data",
    text: "I led the development of an open source app and open data for a variety of social datasets in the US.",
    image: "https://jareds-file-sharing.s3.amazonaws.com/social-data.png",
    link: "https://share.streamlit.io/arup-group/social-data/run.py",
    github: "https://github.com/arup-group/social-data",
  },
  {
    title: "deal or no deal",
    text: "I watched over 100 episodes of Deal or No Deal to conduct this analysis of the greatest game show of all time.",
    image: "https://jareds-file-sharing.s3.amazonaws.com/dond-interface.png",
    link: "https://share.streamlit.io/jstock29/dealnodeal/main/app.py",
    github: "https://github.com/jstock29/dealnodeal",
  },
  {
    title: "teetum.com",
    text: "I made a website for my friend's birthday as joke. You won't get the jokes.",
    image: "https://jareds-file-sharing.s3.amazonaws.com/teetum.png",
    link: "https://teetum.com/",
    github: "https://github.com/jstock29/teetum-dot-com",
  },
  {
    title: "bigballsannie.com",
    text: "I made yet another joke website for my friend's birthday, only even weirder somehow.",
    image: "https://jareds-file-sharing.s3.amazonaws.com/bba.png",
    link: "https://bigballsannie.com/",
    github: "https://github.com/jstock29/bigballsannie-dot-com",
  },
];

const work = [
  {
    date: "2016",
    text: "Graduated University of Colorado - Boulder",
    color: "primary",
  },
  {
    date: "2016",
    text: "Started at Arup New York",
    color: "primary",
  },
  {
    date: "2018",
    text: "Delivered genetic optimization of energy models for NRDC",
    color: "primary",
  },
  {
    date: "2019",
    text: "Presented at World Engineering Conference Melbourne",
    color: "primary",
  },
  {
    date: "2020",
    text: "Led pro-bono open source eviction work",
    color: "primary",
  },
  {
    date: "2021",
    text: "Promoted to Lead Developer",
    color: "primary",
  },
  {
    date: "2021",
    text: "Delivered district energy modeling platfrom on Google Cloud Platform",
    color: "primary",
  },
  {
    date: "2022",
    text: "Joined Thoughtworks as a Senior Developer",
    color: "primary",
  },
  {
    date: "2024",
    text: "Piloted kickboxing bag sensor with Hit House",
    color: "primary",
  },
  // {
  //   date: "2025",
  //   text: "Piloted kickboxing bag sensor with Hit House",
  //   color: "primary",
  // },
];

const publications = [
  {
    title: "i figured out how deal or no deal works (kind of)",
    text: "Towards Data Science",
    image: "https://jareds-file-sharing.s3.amazonaws.com/tds.png",
    link: "https://towardsdatascience.com/i-figured-out-how-deal-or-no-deal-works-kind-of-875e63a8cef6",
  },
  // {
  //     title: 'How data can prevent pandemic-related homelessness',
  //     text: 'Arup.com',
  //     image: 'https://jareds-file-sharing.s3.amazonaws.com/arupdotcom.png',
  //     link: 'https://www.arup.com/perspectives/how-data-can-prevent-pandemic-related-homelessness',
  // },
  // {
  //     title: 'Arup and New Story use data to help combat pandemic related evictions',
  //     text: 'Streamlit Community Blog',
  //     image: 'https://jareds-file-sharing.s3.amazonaws.com/streamlit-blog.png',
  //     link: 'https://blog.streamlit.io/open-source-eviction-data/',
  // },
  {
    title: "an open source approach to preventing evictions",
    text: "Arup Digital News | Medium",
    image: "https://jareds-file-sharing.s3.amazonaws.com/arup-digital.png",
    link: "https://medium.com/arup-digital-news/an-open-source-approach-to-preventing-evictions-5ed4ad5daea6",
  },
];

const skills = [
  { label: "Python", color: "primary", type: "languages" },
  { label: "Pandas", color: "secondary", type: "frameworks_tools" },
  { label: "Streamlit", color: "secondary", type: "frameworks_tools" },
  { label: "Data Analysis", color: "default", type: "skills" },
  { label: "Data Science", color: "default", type: "skills" },
  { label: "Machine Learning", color: "default", type: "skills" },
  { label: "Genetic Algorithms", color: "default", type: "skills" },
  { label: "Javascript", color: "primary", type: "languages" },
  { label: "Typescript", color: "primary", type: "languages" },
  { label: "HTML", color: "primary", type: "languages" },
  { label: "CSS", color: "primary", type: "languages" },
  { label: "Sass", color: "primary", type: "languages" },
  { label: "Angular", color: "secondary", type: "frameworks_tools" },
  { label: "NGRX", color: "secondary", type: "frameworks_tools" },
  { label: "React", color: "secondary", type: "frameworks_tools" },
  { label: "Node.js", color: "secondary", type: "frameworks_tools" },
  { label: "SQL", color: "primary", type: "languages" },
  { label: "PostgreSQL", color: "secondary", type: "frameworks_tools" },
  { label: "Devops", color: "default", type: "skills" },
  { label: "Git", color: "secondary", type: "frameworks_tools" },
  { label: "Docker", color: "secondary", type: "frameworks_tools" },
  { label: "Serverless", color: "secondary", type: "frameworks_tools" },
  { label: "JSON", color: "secondary", type: "frameworks_tools" },
  {
    label: "Amazon Web Services",
    color: "secondary",
    type: "frameworks_tools",
  },
  {
    label: "Google Cloud Platform",
    color: "secondary",
    type: "frameworks_tools",
  },
  { label: "Websockets", color: "default", type: "skills" },
  { label: "Parallel Programming", color: "default", type: "skills" },
  { label: "Linux", color: "default", type: "skills" },
  { label: "Agile", color: "default", type: "skills" },
  { label: "Solution Architecture", color: "default", type: "skills" },
  { label: "Responsive Design", color: "default", type: "skills" },
  { label: "Bash", color: "primary", type: "languages" },
  { label: "MongoDB", color: "secondary", type: "frameworks_tools" },
  { label: "Terraform", color: "secondary", type: "frameworks_tools" },
  { label: "Kubernetes", color: "secondary", type: "frameworks_tools" },
  { label: "Cloud Architecture", color: "default", type: "skills" },
  { label: "Unit Testing", color: "default", type: "skills" },
];

function App() {
  const [skillsSectionVisible, setSkillsSectionVisible] = useState(false);
  const skillsGridRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false); // State to manage hover for resume link animation
  const [activeFilter, setActiveFilter] = useState(null); // State to hold the active filter type

  const handleChipClick = (type) => {
    if (activeFilter === type) {
      setActiveFilter(null); // Toggle off filter if already active
    } else {
      setActiveFilter(type); // Set new filter
    }
  };

  const projectsList = projects.map((proj, i) => (
    <Project
      title={proj.title}
      text={proj.text}
      image={proj.image}
      link={proj.link}
      github={proj.github}
      key={proj.title}
      alternate={i % 2 !== 0}
    />
  ));

  const publicationList = publications.map((pub, i) => (
    <Publication
      title={pub.title}
      text={pub.text}
      image={pub.image}
      link={pub.link}
      key={pub.title}
      alternate={i % 2 !== 0}
    />
  ));

  const filteredSkills = activeFilter
    ? skills.filter((skill) => skill.type === activeFilter)
    : skills;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSkillsSectionVisible(true);
          observer.unobserve(entry.target); // Stop observing once visible
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    if (skillsGridRef.current) {
      observer.observe(skillsGridRef.current);
    }

    return () => {
      if (skillsGridRef.current) {
        observer.unobserve(skillsGridRef.current);
      }
    };
  }, []);

  return (
    <div>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <div className="anchors">
          <div>
            <a href="#about">
              <h5>About</h5>
            </a>
          </div>
          <div>
            <a href="#work">
              <h5>Experience</h5>
            </a>
          </div>
          <div>
            <a href="#projects">
              <h5>Projects</h5>
            </a>
          </div>
          <div>
            <a href="#publications">
              <h5>Publications</h5>
            </a>
          </div>
        </div>
      </Box>
      <div className="App">
        <Scroll />
        <div className="about" id="about">
          <About></About>
        </div>
        <div className="work" id="work">
          <div>
            <h1 className="section-title">experience</h1>
          </div>
          <div>
            <WorkTimeline work={work} />
          </div>
          <div>
            <Grid container direction="row" className={"skills-legend"}>
              <Chip
                size="small"
                label={"Languages"}
                onClick={() => handleChipClick("languages")}
                className={`category-1 ${
                  activeFilter && activeFilter !== "languages" ? "faded" : ""
                }`}
              />
              <Chip
                size="small"
                label={"Frameworks + Tools"}
                onClick={() => handleChipClick("frameworks_tools")}
                className={`category-2 ${
                  activeFilter && activeFilter !== "frameworks_tools"
                    ? "faded"
                    : ""
                }`}
              />
              <Chip
                size="small"
                label={"Skills"}
                onClick={() => handleChipClick("skills")}
                className={`category-3 ${
                  activeFilter && activeFilter !== "skills" ? "faded" : ""
                }`}
              />
            </Grid>
            <Grid
              container
              direction="row"
              justifyContent="space-evenly"
              alignItems="center"
              ref={skillsGridRef}
              className={"skills-grid"}
            >
              <AnimatePresence>
                {filteredSkills
                  .sort((a, b) => (a.label > b.label ? 1 : -1))
                  .map((skill, i) => (
                    <Skill
                      label={skill.label}
                      color={skill.color}
                      key={skill.label}
                      pos={i}
                      parentIsVisible={skillsSectionVisible}
                    />
                  ))}
              </AnimatePresence>
            </Grid>
            <a
              href="https://jareds-file-sharing.s3.amazonaws.com/Jared+Stock+Resume.pdf"
              target="_blank"
              rel="noreferrer"
              className="link"
            >
              <motion.h4
                className={"resume"}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                animate={
                  isHovered
                    ? {
                        y: ["0%", "-25%", "0%"], // Increased bounce height
                        rotate: [0, 5, -5, 0], // Added subtle rotation
                        transition: {
                          duration: 0.7, // Slightly faster to enhance visibility
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }
                    : { y: "0%", rotate: 0 } // Reset rotate when not hovered
                }
                whileTap={{ scale: 0.9 }}
              >
                Resume
              </motion.h4>
            </a>
          </div>
        </div>
        <div className="projects" id="projects">
          <div>
            <h1 className="section-title">projects</h1>
          </div>
          <Grid
            container
            direction="column"
            justifyContent="space-evenly"
            alignItems="center"
          >
            {projectsList}
          </Grid>
        </div>
        <div className="publications" id="publications">
          <div>
            <h1 className="section-title">publications</h1>
          </div>
          <Grid
            container
            direction="column"
            justifyContent="space-evenly"
            alignItems="center"
          >
            {publicationList}
          </Grid>
        </div>
        <footer className={"footer"}>Jared Stock | 2026 | NYC</footer>
      </div>
    </div>
  );
}

export default App;
