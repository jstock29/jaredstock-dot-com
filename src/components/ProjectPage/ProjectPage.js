import "./ProjectPage.scss";
import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { Chip, CircularProgress } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LaunchIcon from "@mui/icons-material/Launch";
import { auth } from "../../firebase";
import { getProjectBySlug, isPublished, projectPath } from "../../data/projects";
import { OrbitField } from "../Scroll/OrbitField";
import { SiteFooter, SiteNav, useDocumentTitle } from "../SiteChrome/SiteChrome";
import { BlockRenderer, Media } from "./blocks/Blocks";

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut", delay } },
});

// Drafts are only fetched for a signed-in admin who asked for ?preview=1.
function usePreviewMode() {
  const [searchParams] = useSearchParams();
  const wantsPreview = searchParams.get("preview") === "1";
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!wantsPreview) return;
    return onAuthStateChanged(auth, setUser);
  }, [wantsPreview]);

  if (!wantsPreview) return { ready: true, preview: false };
  return { ready: user !== undefined, preview: Boolean(user) };
}

export default function ProjectPage() {
  const { slug } = useParams();
  const { ready, preview } = usePreviewMode();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setState({ loading: true });
    getProjectBySlug(slug, { includeDrafts: preview })
      .then((result) => !cancelled && setState({ loading: false, ...result }))
      .catch((error) => !cancelled && setState({ loading: false, error }));
    return () => {
      cancelled = true;
    };
  }, [slug, ready, preview]);

  const { loading, project, prev, next, error } = state;
  useDocumentTitle(project ? `${project.title} · Jared Stock` : null);

  const crumbs = [{ to: "/projects", label: "projects" }];

  if (loading) {
    return (
      <div className="project-page project-page-status">
        <SiteNav crumbs={crumbs} />
        <CircularProgress sx={{ color: "var(--navy)" }} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-page project-page-status">
        <SiteNav crumbs={crumbs} />
        <h1 className="section-title">lost in space</h1>
        <p>{error ? "Couldn't load this project." : "There's no project here."}</p>
        <Link to="/projects" className="project-page-cta">
          back to the orbit →
        </Link>
      </div>
    );
  }

  const blocks = project.blocks || [];
  const tags = project.tags || [];
  const meta = [project.year, project.role].filter(Boolean);
  const hero = project.hero?.src ? project.hero : project.image ? { src: project.image, type: "image" } : null;

  return (
    <div className="project-page">
      <SiteNav crumbs={crumbs} />

      <header className="project-page-header">
        <div className="project-page-orbits" aria-hidden="true">
          <OrbitField
            numShapes={10}
            sizeRange={[6, 14]}
            distanceRange={[140, 320]}
            speedRange={[0.002, 0.008]}
            shapeTypes={["circle", "polygon", "diamond"]}
            hasOrbitPaths={false}
            fillAlpha={140}
            sizeMultiplier={1.2}
            influenceRadius={40}
            scatterMultiplier={16}
          />
        </div>
        <div className="project-page-header-content">
          {preview && !isPublished(project) && <span className="project-page-draft">draft preview</span>}
          <motion.h1 className="project-page-title" {...rise()}>
            {project.title}
          </motion.h1>
          {(project.tagline || project.text) && (
            <motion.p className="project-page-tagline" {...rise(0.1)}>
              {project.tagline || project.text}
            </motion.p>
          )}
          <motion.div className="project-page-meta" {...rise(0.2)}>
            {meta.length > 0 && <span>{meta.join(" · ")}</span>}
            {tags.map((tag, i) => (
              <Chip key={tag} size="small" label={tag} className={`category-${(i % 3) + 1}`} />
            ))}
          </motion.div>
          <motion.div className="project-page-links" {...rise(0.3)}>
            {project.github && (
              <a href={project.github} target="_blank" rel="noreferrer" className="link-icon" aria-label="Source on GitHub">
                <GitHubIcon style={{ fontSize: 22 }} />
              </a>
            )}
            {project.link && (
              <a href={project.link} target="_blank" rel="noreferrer" className="link-icon" aria-label="Visit the live project">
                <LaunchIcon style={{ fontSize: 22 }} />
              </a>
            )}
          </motion.div>
        </div>
      </header>

      {hero && (
        <motion.figure className="project-page-hero block-width-wide" {...rise(0.35)}>
          <Media src={hero.src} alt={hero.alt || project.title} poster={hero.poster} video={hero.type === "video"} />
        </motion.figure>
      )}

      <article className="project-page-body">
        {blocks.length > 0 ? (
          <BlockRenderer blocks={blocks} />
        ) : (
          project.tagline && project.text && <p className="block-text">{project.text}</p>
        )}
      </article>

      {prev && next && prev.id !== project.id && (
        <nav className="project-page-pager" aria-label="More projects">
          <Link to={projectPath(prev)}>
            <span className="project-page-pager-label">← previous</span>
            <span className="project-page-pager-title">{prev.title}</span>
          </Link>
          <Link to="/projects" className="project-page-pager-center" aria-label="All projects">
            <span className="project-page-pager-sun" />
          </Link>
          <Link to={projectPath(next)} className="project-page-pager-next">
            <span className="project-page-pager-label">next →</span>
            <span className="project-page-pager-title">{next.title}</span>
          </Link>
        </nav>
      )}

      <SiteFooter />
    </div>
  );
}
