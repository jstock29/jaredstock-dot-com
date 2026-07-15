import "./App.scss";
import "./components/Scroll/Scroll.scss";
import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from './components/Admin/Admin';
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence
import { OrbitField } from "./components/Scroll/OrbitField";
import { EntryPointer } from "./components/Scroll/EntryPointer";
import { PageTitle } from "./components/Scroll/PageTitle";
import { Project } from "./components/Project/Project";
import { WorkTimeline } from "./components/WorkTimeline/WorkTimeline";
import { Publication } from "./components/Publication/Publication";
import { About } from "./components/About/About";
import { Skill } from "./components/Skill/Skill";
import { Box, Chip, Grid } from "@mui/material";
import { Signature } from "./components/Signature";
import { SnowAccumulator } from "./components/SnowAccumulator/SnowAccumulator";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<PortfolioContent />} />
      </Routes>
    </BrowserRouter>
  );
}

function PortfolioContent() {
  const [projects, setProjects] = useState([]);
  const [publications, setPublications] = useState([]);
  const [skills, setSkills] = useState([]);
  const [work, setWork] = useState([]);

  useEffect(() => {
    getDocs(collection(db, "projects")).then(snapshot => {
       const projectData = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
       projectData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
       setProjects(projectData);
    });
    getDocs(collection(db, "publications")).then(snapshot => {
       setPublications(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
    });
    getDocs(collection(db, "skills")).then(snapshot => {
       setSkills(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
    });
    getDocs(collection(db, "work")).then(snapshot => {
       const workData = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
       workData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
       setWork(workData);
    });
  }, []);
  const [skillsSectionVisible, setSkillsSectionVisible] = useState(false);
  const skillsGridRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false); // State to manage hover for resume link animation
  const [activeFilter, setActiveFilter] = useState(null); // State to hold the active filter type
  const [isSnowActive, setIsSnowActive] = useState(false);

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
        <div className="hero">
          <OrbitField
            className="orbits-container"
            numShapes={29}
            sizeRange={[12, 36]}
            distanceRange={[180, 420]}
            speedRange={[0.005, 0.018]}
            shapeTypes={["circle", "polygon", "rect", "diamond"]}
            wobbleRange={[0, 1.5]}
            wobbleSpeedRange={[0.0, 0.04]}
            orbitPathRadius={[180, 420]}
            orbitPathStep={60}
            shadowBlur={6}
            shadowColor="rgba(9, 48, 107, 0.18)"
            fillAlpha={220}
            sizeMultiplier={1.5}
            influenceRadius={45}
            scatterMultiplier={20}
            velocityInfluence={1}
            springKRange={[0.02, 0.06]}
            dampingRange={[0.85, 0.95]}
          />
          <div className="hero-content">
            <PageTitle />
            {/* <EntryPointer />*/}
          </div>
        </div>
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
            <div style={{ position: "relative", display: "inline-block" }}>
              <OrbitField
                style={{ position: "absolute", zIndex: 0 }}
                numShapes={7}
                sizeRange={[5, 9]}
                distanceRange={[24, 36]}
                speedRange={[0.01, 0.02]}
                colorPalette={["#09306B", "#4F83D1", "#BAA22B", "#D5C471"]}
                shapeTypes={["circle", "polygon"]}
                hasWobble={false}
                hasOrbitPaths={false}
                shadowBlur={4}
                shadowColor="rgba(9, 48, 107, 0.15)"
                fillAlpha={200}
                sizeMultiplier={1}
                influenceRadius={10}
                scatterMultiplier={10}
                velocityInfluence={1}
                springKRange={[0.03, 0.08]}
                dampingRange={[0.82, 0.92]}
              />
              <a
                href="https://jareds-file-sharing.s3.amazonaws.com/Jared+Stock+Resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="link"
                style={{ position: "relative", zIndex: 1 }}
              >
                <motion.h4
                  className={"resume"}
                >
                  Resume
                </motion.h4>
              </a>
            </div>
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
        {/* Bring the canvas to the very front using z-index 9999 */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "80vh",
            zIndex: 9999,
            pointerEvents: "none", // Let clicks pass through
          }}
        >
          <SnowAccumulator
            style={{
              width: "100%",
              height: "100%",
              pointerEvents: "none", // Snow canvas itself shouldn't block
            }}
            isActive={isSnowActive}
          />
        </div>
        <footer
          className="footer"
          style={{
            position: "relative",
            zIndex: 1000,
            backgroundColor: "transparent",
          }}
        >
          <Signature
          onClick={() => {
            setIsSnowActive(!isSnowActive);
          }}/>
          <div
            style={{ textAlign: "center", padding: "0 0 50px 0", width: "100%" }}
          >
            <h4
              style={{
                display: "inline",
                margin: 0,
                cursor: "pointer",
                textDecoration: "none",
              }}
              onClick={() => {
                setIsSnowActive(!isSnowActive);
              }}
            >
              Jared Stock
            </h4>
            <span style={{ display: "inline" }}> | 2026 | NYC</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
