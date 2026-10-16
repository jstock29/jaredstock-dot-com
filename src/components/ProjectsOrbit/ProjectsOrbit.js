import "./ProjectsOrbit.scss";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getProjects, projectPath } from "../../data/projects";
import { SiteFooter, SiteNav, useDocumentTitle } from "../SiteChrome/SiteChrome";

const RING_COLORS = ["var(--navy)", "var(--gold)", "var(--navy-light)", "var(--gold-light)"];
const MOON_SHAPES = ["square", "diamond", "triangle", "hexagon"];
const TAU = Math.PI * 2;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Stage geometry: rings are tilted ellipses sized to fit whatever the viewport is.
function layout(width, height, count) {
  const narrow = width < 700;
  const planet = narrow ? 58 : 84;
  const sun = narrow ? 36 : 176;
  // Portrait screens get rounder ellipses so the rings use the vertical space.
  const tilt = Math.min(1.25, Math.max(0.36, (height / width) * 0.45));
  const maxRx = Math.max(80, Math.min(width / 2 - planet * 0.75, (height / 2 - planet) / tilt));
  const innerRx = Math.min(maxRx, sun / 2 + planet * (narrow ? 0.9 : 0.8));
  const rings = Math.max(1, Math.min(count, narrow ? 3 : 4));
  const radii = Array.from({ length: rings }, (_, i) =>
    rings === 1 ? (innerRx + maxRx) / 2 : innerRx + ((maxRx - innerRx) * i) / (rings - 1),
  );
  return { narrow, planet, sun, tilt, radii };
}

// Spread projects round-robin across rings, evenly phased within each ring.
function assignOrbits(projects, radii) {
  const perRing = radii.map(() => []);
  projects.forEach((p, i) => perRing[i % radii.length].push(p));
  const inner = radii[0];
  return perRing.flatMap((ringProjects, ring) =>
    ringProjects.map((project, k) => ({
      project,
      ring,
      phase: (TAU * k) / ringProjects.length + ring * 0.9,
      // Kepler-ish: inner rings move faster.
      speed: 0.22 * Math.pow(inner / radii[ring], 1.5),
    })),
  );
}

function MoonShape({ shape }) {
  const r = 5;
  let d;
  if (shape === "square") d = `M ${-r},${-r} L ${r},${-r} L ${r},${r} L ${-r},${r} Z`;
  else if (shape === "diamond") d = `M 0,${-r} L ${r},0 L 0,${r} L ${-r},0 Z`;
  else {
    const n = shape === "triangle" ? 3 : 6;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (TAU * i) / n - Math.PI / 2;
      return `${r * Math.cos(a)},${r * Math.sin(a)}`;
    });
    d = `M ${pts.join(" L ")} Z`;
  }
  return (
    <svg width={r * 2} height={r * 2} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`}>
      <path d={d} />
    </svg>
  );
}

function Stars({ count = 48 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 3,
        delay: `${Math.random() * 6}s`,
        gold: Math.random() < 0.3,
      })),
    [count],
  );
  return (
    <div className="orbit-stars" aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className={s.gold ? "gold" : ""}
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
        />
      ))}
    </div>
  );
}

export default function ProjectsOrbit() {
  useDocumentTitle("Projects · Jared Stock");
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState(null);
  const [launch, setLaunch] = useState(null);

  const stageRef = useRef(null);
  const planetRefs = useRef([]);
  const activeRef = useRef(null);
  const motionRef = useRef({ spin: 0, spinVel: 0, timeScale: 1, drag: null, suppressClick: false });

  useEffect(() => {
    getProjects().then(setProjects).catch(setError);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(
    () => (size.width ? layout(size.width, size.height, projects?.length || 1) : null),
    [size, projects],
  );
  const orbits = useMemo(() => (geo && projects ? assignOrbits(projects, geo.radii) : []), [geo, projects]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Animation loop: writes transforms straight to the DOM so React only re-renders on hover.
  useEffect(() => {
    if (!geo || orbits.length === 0) return;
    const reduced = prefersReducedMotion();
    const m = motionRef.current;
    let t = 0;
    let last = performance.now();
    let frame;

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const targetScale = activeRef.current ? 0.06 : reduced ? 0 : 1;
      m.timeScale += (targetScale - m.timeScale) * Math.min(1, dt * 4);
      t += dt * m.timeScale;

      if (!m.drag) {
        m.spin += m.spinVel * dt;
        m.spinVel *= Math.pow(0.12, dt); // friction
      }

      const cx = size.width / 2;
      const cy = size.height / 2;
      orbits.forEach((o, i) => {
        const el = planetRefs.current[i];
        if (!el) return;
        const angle = o.phase + t * o.speed + m.spin;
        const rx = geo.radii[o.ring];
        const x = cx + Math.cos(angle) * rx;
        const y = cy + Math.sin(angle) * rx * geo.tilt;
        const depth = (Math.sin(angle) + 1) / 2; // 0 = far side, 1 = near side
        const isActive = activeRef.current === o.project.id;
        const scale = 0.66 + depth * 0.4;
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
        el.style.zIndex = isActive ? 50 : depth > 0.5 ? 20 + Math.round(depth * 10) : Math.round(depth * 10);
        el.style.setProperty("--depth", depth.toFixed(3));
      });

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [geo, orbits, size]);

  // Drag anywhere on the stage to spin the whole system; let go to fling it.
  const angleAt = useCallback((e) => {
    const rect = stageRef.current.getBoundingClientRect();
    const tilt = geo?.tilt || 1;
    return Math.atan2((e.clientY - rect.top - rect.height / 2) / tilt, e.clientX - rect.left - rect.width / 2);
  }, [geo]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const m = motionRef.current;
    m.drag = { angle: angleAt(e), x: e.clientX, y: e.clientY, time: performance.now(), moved: 0 };
    m.spinVel = 0;
    m.suppressClick = false;

    const onMove = (ev) => {
      const d = m.drag;
      if (!d) return;
      let delta = angleAt(ev) - d.angle;
      if (delta > Math.PI) delta -= TAU;
      if (delta < -Math.PI) delta += TAU;
      const now = performance.now();
      const dt = Math.max(1, now - d.time) / 1000;
      m.spin += delta;
      m.spinVel = m.spinVel * 0.5 + (delta / dt) * 0.5;
      d.moved += Math.hypot(ev.clientX - d.x, ev.clientY - d.y);
      d.x = ev.clientX;
      d.y = ev.clientY;
      d.angle += delta;
      d.time = now;
      if (d.moved > 6) m.suppressClick = true;
    };
    const onUp = () => {
      if (m.drag && performance.now() - m.drag.time > 80) m.spinVel = 0; // held still before release
      m.spinVel = Math.max(-12, Math.min(12, m.spinVel));
      m.drag = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onPlanetClick = (e, project, color) => {
    const m = motionRef.current;
    if (m.suppressClick) {
      e.preventDefault();
      m.suppressClick = false;
      return;
    }
    // Leave modified clicks (new tab etc.) to the browser.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const path = projectPath(project);
    if (prefersReducedMotion()) {
      navigate(path);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setLaunch({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color,
      path,
      cover: Math.hypot(window.innerWidth, window.innerHeight) * 2.2,
    });
  };

  const activeProject = projects?.find((p) => p.id === active);

  const readout = activeProject ? (
    <>
      <span className="orbit-readout-title">{activeProject.title}</span>
      {(activeProject.tagline || activeProject.text) && (
        <span className="orbit-readout-text">{activeProject.tagline || activeProject.text}</span>
      )}
      <span className="orbit-readout-hint">click to land →</span>
    </>
  ) : (
    <>
      <span className="orbit-readout-title">projects</span>
      <span className="orbit-readout-text">
        {error ? "lost signal. try again?" : projects ? `${projects.length} in orbit` : "warming up…"}
      </span>
      {projects?.length > 0 && <span className="orbit-readout-hint">drag to spin · hover to catch one</span>}
    </>
  );

  return (
    <div className="projects-orbit-page">
      <SiteNav />

      <section
        className={`orbit-stage ${active ? "orbit-stage-has-active" : ""}`}
        ref={stageRef}
        onPointerDown={onPointerDown}
        aria-label="Projects orbiting in a little solar system"
      >
        <Stars />

        {geo && (
          <svg className="orbit-rings" width={size.width} height={size.height} aria-hidden="true">
            {geo.radii.map((rx, i) => (
              <ellipse
                key={rx}
                cx={size.width / 2}
                cy={size.height / 2}
                rx={rx}
                ry={rx * geo.tilt}
                stroke={RING_COLORS[i % RING_COLORS.length]}
              />
            ))}
          </svg>
        )}

        <button
          type="button"
          className={`orbit-sun ${geo?.narrow ? "orbit-sun-small" : ""}`}
          style={geo ? { width: geo.sun, height: geo.sun } : undefined}
          onClick={() => {
            // A little kick for anyone who pokes the sun.
            motionRef.current.spinVel += 4 * (Math.random() < 0.5 ? -1 : 1);
          }}
          aria-label="Give the system a spin"
        >
          {!geo?.narrow && (
            <span className="orbit-readout" aria-live="polite">
              {readout}
            </span>
          )}
        </button>

        {geo &&
          orbits.map((o, i) => {
            const color = RING_COLORS[o.ring % RING_COLORS.length];
            const { project } = o;
            return (
              <Link
                key={project.id}
                ref={(el) => (planetRefs.current[i] = el)}
                to={projectPath(project)}
                className={`orbit-planet ${active === project.id ? "orbit-planet-active" : ""}`}
                style={{ "--planet-size": `${geo.planet}px`, "--ring-color": color }}
                draggable={false}
                onClick={(e) => onPlanetClick(e, project, color)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(project.id)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
                onFocus={() => setActive(project.id)}
                onBlur={() => setActive(null)}
              >
                <span className="orbit-planet-body">
                  {project.image ? (
                    <img src={project.image} alt="" draggable={false} />
                  ) : (
                    <span className="orbit-planet-initial">{project.title?.[0]}</span>
                  )}
                </span>
                <span
                  className="orbit-moon"
                  style={{ animationDuration: `${4 + (i % 4) * 1.5}s`, animationDirection: i % 2 ? "reverse" : "normal" }}
                  aria-hidden="true"
                >
                  <MoonShape shape={MOON_SHAPES[i % MOON_SHAPES.length]} />
                </span>
                <span className="orbit-planet-label">{project.title}</span>
              </Link>
            );
          })}

        {geo?.narrow && (
          <div className="orbit-readout orbit-readout-docked" aria-live="polite">
            {readout}
          </div>
        )}
      </section>

      {projects?.length > 0 && (
        <section className="orbit-manifest" aria-labelledby="manifest-title">
          <h2 id="manifest-title" className="section-title">
            flight manifest
          </h2>
          <ol>
            {projects.map((project, i) => (
              <li key={project.id}>
                <Link
                  to={projectPath(project)}
                  onPointerEnter={() => setActive(project.id)}
                  onPointerLeave={() => setActive(null)}
                >
                  <span className="orbit-manifest-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="orbit-manifest-title">{project.title}</span>
                  <span className="orbit-manifest-text">{project.tagline || project.text}</span>
                  {project.year && <span className="orbit-manifest-year">{project.year}</span>}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <SiteFooter />

      <AnimatePresence>
        {launch && (
          <motion.div
            className="orbit-launch"
            style={{ left: launch.x, top: launch.y, "--launch-color": launch.color }}
            initial={{ width: 0, height: 0 }}
            animate={{ width: launch.cover, height: launch.cover }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.3, 1] }}
            onAnimationComplete={() => navigate(launch.path)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
