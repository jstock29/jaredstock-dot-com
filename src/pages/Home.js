import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Chip, Grid } from "@mui/material";
import { db } from "../firebase";
import { entryPath, getEntries, hasPage } from "../data/content";
import { useSettings } from "../data/settings";
import { OrbitField } from "../components/Scroll/OrbitField";
import { PageTitle } from "../components/Scroll/PageTitle";
import { Project } from "../components/Project/Project";
import { WorkTimeline } from "../components/WorkTimeline/WorkTimeline";
import { Publication } from "../components/Publication/Publication";
import { About } from "../components/About/About";
import { Skill } from "../components/Skill/Skill";
import { Signature } from "../components/Signature";
import { SnowAccumulator } from "../components/SnowAccumulator/SnowAccumulator";
import { HomeNav } from "../components/SiteChrome/HomeNav";

const SKILL_FILTERS = [
  { type: "languages", label: "Languages", className: "category-1" },
  { type: "frameworks_tools", label: "Frameworks + Tools", className: "category-2" },
  { type: "skills", label: "Skills", className: "category-3" },
];

function loadCollection(name) {
  return getDocs(collection(db, name)).then((snapshot) =>
    snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
  );
}

export default function Home() {
  const settings = useSettings();
  const [projects, setProjects] = useState([]);
  const [publications, setPublications] = useState([]);
  const [pages, setPages] = useState([]);
  const [skills, setSkills] = useState([]);
  const [work, setWork] = useState([]);

  useEffect(() => {
    getEntries("projects").then(setProjects);
    getEntries("publications").then(setPublications);
    getEntries("pages").then(setPages).catch(() => setPages([]));
    loadCollection("skills").then((data) =>
      setSkills(data.sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""))),
    );
    loadCollection("work").then((data) => setWork(data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))));
  }, []);

  const [skillsSectionVisible, setSkillsSectionVisible] = useState(false);
  const skillsGridRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [isSnowActive, setIsSnowActive] = useState(false);

  const handleChipClick = (type) => setActiveFilter(activeFilter === type ? null : type);

  const filteredSkills = activeFilter ? skills.filter((skill) => skill.type === activeFilter) : skills;

  useEffect(() => {
    const el = skillsGridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSkillsSectionVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [settings]);

  if (!settings) return <div className="App" style={{ minHeight: "100vh" }} />;

  const { sections } = settings;
  const navPages = pages.filter((p) => p.showInNav);

  return (
    <div>
      <HomeNav sections={sections} pages={navPages} />
      <main className="App">
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
            <PageTitle name={settings.name} links={settings.links} />
          </div>
        </div>
        {sections.about.show && (
          <div className="about" id="about">
            <About about={settings.about} />
          </div>
        )}
        {sections.work.show && (
          <div className="work" id="work">
            <div>
              <h1 className="section-title">{sections.work.title}</h1>
            </div>
            <div>
              <WorkTimeline work={work} />
            </div>
            <div>
              <Grid container direction="row" className={"skills-legend"}>
                {SKILL_FILTERS.map((f) => (
                  <Chip
                    key={f.type}
                    size="small"
                    label={f.label}
                    onClick={() => handleChipClick(f.type)}
                    className={`${f.className} ${activeFilter && activeFilter !== f.type ? "faded" : ""}`}
                  />
                ))}
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
                  {filteredSkills.map((skill, i) => (
                    <Skill
                      label={skill.label}
                      color={skill.color}
                      key={skill.id}
                      pos={i}
                      parentIsVisible={skillsSectionVisible}
                    />
                  ))}
                </AnimatePresence>
              </Grid>
              {settings.resumeUrl && (
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
                    href={settings.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                    style={{ position: "relative", zIndex: 1 }}
                  >
                    <motion.span className={"resume"}>Resume</motion.span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        {sections.projects.show && (
          <div className="projects" id="projects">
            <div>
              <h1 className="section-title">{sections.projects.title}</h1>
            </div>
            <Grid container direction="column" justifyContent="space-evenly" alignItems="center">
              {projects.map((proj, i) => (
                <Project
                  title={proj.title}
                  text={proj.text}
                  image={proj.image}
                  link={proj.link}
                  github={proj.github}
                  to={entryPath("projects", proj)}
                  key={proj.id}
                  alternate={i % 2 !== 0}
                />
              ))}
            </Grid>
          </div>
        )}
        {sections.publications.show && (
          <div className="publications" id="publications">
            <div>
              <h1 className="section-title">{sections.publications.title}</h1>
            </div>
            <Grid container direction="column" justifyContent="space-evenly" alignItems="center">
              {publications.map((pub, i) => (
                <Publication
                  title={pub.title}
                  text={pub.text}
                  image={pub.image}
                  link={pub.link}
                  to={hasPage("publications", pub) ? entryPath("publications", pub) : null}
                  key={pub.id}
                  alternate={i % 2 !== 0}
                />
              ))}
            </Grid>
          </div>
        )}
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
            style={{ width: "100%", height: "100%", pointerEvents: "none" }}
            isActive={isSnowActive}
          />
        </div>
        <div
          className="footer"
          style={{ position: "relative", zIndex: 1000, backgroundColor: "transparent" }}
        >
          <Signature />
          <div style={{ textAlign: "center", padding: "0 0 50px 0", width: "100%" }}>
            <button
              type="button"
              className="footer-snow-toggle"
              aria-pressed={isSnowActive}
              aria-label={`${settings.footer.name}: let it snow`}
              onClick={() => setIsSnowActive(!isSnowActive)}
            >
              {settings.footer.name}
            </button>
            <span style={{ display: "inline" }}>
              {" "}
              | {new Date().getFullYear()} | {settings.footer.location}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

