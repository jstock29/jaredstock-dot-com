import "./EntryPage.scss";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Chip, CircularProgress } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LaunchIcon from "@mui/icons-material/Launch";
import { usePreviewMode } from "../../hooks/usePreviewMode";
import { ENTRY_TYPES, entryPath, getEntryBySlug, isPublished } from "../../data/content";
import { useSettings } from "../../data/settings";
import { OrbitField } from "../Scroll/OrbitField";
import { SiteFooter, SiteNav, useDocumentTitle } from "../SiteChrome/SiteChrome";
import { BlockRenderer, Media } from "./blocks/Blocks";

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut", delay } },
});

// Where the breadcrumb and the pager's centre button lead for each content type.
function listingFor(type, settings) {
  if (type === "projects") return { to: "/#projects", label: settings?.sections.projects.title ?? "projects" };
  if (type === "publications") return { to: "/#publications", label: settings?.sections.publications.title ?? "publications" };
  return null;
}

export default function EntryPage({ type }) {
  const { slug } = useParams();
  const { ready, preview } = usePreviewMode();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setState({ loading: true });
    getEntryBySlug(type, slug, { includeDrafts: preview })
      .then((result) => !cancelled && setState({ loading: false, ...result }))
      .catch((error) => !cancelled && setState({ loading: false, error }));
    return () => {
      cancelled = true;
    };
  }, [type, slug, ready, preview]);

  const settings = useSettings();
  const { loading, entry: project, prev, next, error } = state;
  useDocumentTitle(project && settings ? `${project.title} · ${settings.footer.name}` : null);

  const listing = listingFor(type, settings);
  const crumbs = listing ? [listing] : [];
  const backTo = listing?.to ?? "/";

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
        <p>{error ? "Couldn't load this page." : "There's nothing here."}</p>
        <Link to={backTo} className="project-page-cta">
          back home →
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
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="link-icon"
                aria-label={type === "publications" ? "Read the article" : `Visit the live ${ENTRY_TYPES[type].singular}`}
              >
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

      {type !== "pages" && prev && next && prev.id !== project.id && (
        <nav className="project-page-pager" aria-label="More projects">
          <Link to={entryPath(type, prev)}>
            <span className="project-page-pager-label">← previous</span>
            <span className="project-page-pager-title">{prev.title}</span>
          </Link>
          <Link to={backTo} className="project-page-pager-center" aria-label={listing ? `All ${listing.label}` : "Home"}>
            <span className="project-page-pager-sun" />
          </Link>
          <Link to={entryPath(type, next)} className="project-page-pager-next">
            <span className="project-page-pager-label">next →</span>
            <span className="project-page-pager-title">{next.title}</span>
          </Link>
        </nav>
      )}

      <SiteFooter />
    </div>
  );
}
