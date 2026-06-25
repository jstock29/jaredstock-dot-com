import React, { useRef, useEffect } from "react";
import p5 from "p5";

const defaults = {
  numShapes: 24,
  sizeRange: [15, 35],
  distanceRange: [160, 360],
  speedRange: [0.005, 0.018],
  colorPalette: [
    "#09306B",
    "#4F83D1",
    "#93AFD9",
    "#BAA22B",
    "#D5C471",
    "#DDD7B7",
  ],
  shapeTypes: ["circle", "polygon", "diamond"],
  wobbleRange: [0.5, 2],
  wobbleSpeedRange: [0.015, 0.04],
  orbitPathRadius: [160, 360],
  orbitPathStep: 40,
  shadowBlur: 6,
  shadowColor: "rgba(9, 48, 107, 0.18)",
  fillAlpha: 220,
  sizeMultiplier: 1.5,
  hasOrbitPaths: true,
  hasWobble: true,
  hasMouseInteraction: true,
  influenceRadius: 120,
  scatterMultiplier: 40,
  velocityInfluence: 2,
  springKRange: [0.02, 0.06],
  dampingRange: [0.85, 0.95],
};

export const OrbitField = ({
  numShapes,
  sizeRange,
  distanceRange,
  speedRange,
  colorPalette,
  shapeTypes,
  wobbleRange,
  wobbleSpeedRange,
  orbitPathRadius,
  orbitPathStep,
  shadowBlur,
  shadowColor,
  fillAlpha,
  sizeMultiplier,
  hasOrbitPaths,
  hasWobble,
  hasMouseInteraction,
  influenceRadius,
  scatterMultiplier,
  velocityInfluence,
  springKRange,
  dampingRange,
  className,
  style,
}) => {
  const containerRef = useRef(null);
  const p5Ref = useRef(null);

  const cfg = {
    ...defaults,
    numShapes: numShapes ?? defaults.numShapes,
    sizeRange: sizeRange ?? defaults.sizeRange,
    distanceRange: distanceRange ?? defaults.distanceRange,
    speedRange: speedRange ?? defaults.speedRange,
    colorPalette: colorPalette ?? defaults.colorPalette,
    shapeTypes: shapeTypes ?? defaults.shapeTypes,
    wobbleRange: wobbleRange ?? defaults.wobbleRange,
    wobbleSpeedRange: wobbleSpeedRange ?? defaults.wobbleSpeedRange,
    orbitPathRadius: orbitPathRadius ?? defaults.orbitPathRadius,
    orbitPathStep: orbitPathStep ?? defaults.orbitPathStep,
    shadowBlur: shadowBlur ?? defaults.shadowBlur,
    shadowColor: shadowColor ?? defaults.shadowColor,
    fillAlpha: fillAlpha ?? defaults.fillAlpha,
    sizeMultiplier: sizeMultiplier ?? defaults.sizeMultiplier,
    hasOrbitPaths:
      hasOrbitPaths !== undefined ? hasOrbitPaths : defaults.hasOrbitPaths,
    hasWobble: hasWobble ?? defaults.hasWobble,
    hasMouseInteraction: hasMouseInteraction ?? defaults.hasMouseInteraction,
    influenceRadius: influenceRadius ?? defaults.influenceRadius,
    scatterMultiplier: scatterMultiplier ?? defaults.scatterMultiplier,
    velocityInfluence: velocityInfluence ?? defaults.velocityInfluence,
    springKRange: springKRange ?? defaults.springKRange,
    dampingRange: dampingRange ?? defaults.dampingRange,
  };

  // Helper to convert hex color to p5 color with alpha
  const hexToColor = (p, hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return p.color(r, g, b, alpha);
  };

  useEffect(() => {
    // Ensure the container is ready
    if (!containerRef.current) return;

    // --- DEFENSIVE CLEANUP ON MOUNT ---
    // If the container already has a canvas, remove it before we do anything else.
    // This handles scenarios where React unmounts/remounts are delayed or messy.
    const existingCanvases = containerRef.current.querySelectorAll("canvas");
    if (existingCanvases.length > 0) {
      console.log(
        `Force-clearing ${existingCanvases.length} existing canvas(es)`,
      );
      existingCanvases.forEach((c) => c.remove());
    }

    // Prevent redundant initialization
    if (p5Ref.current) {
      console.log("already initialized, skipping");
      return;
    }

    console.log("create orbit field");

    const sketch = (p) => {
      let shapes = [];
      let canvasCenter = { x: 0, y: 0 };
      let mousePos = { x: 0, y: 0 };
      let mouseVel = { x: 0, y: 0 };
      let prevMousePos = { x: 0, y: 0 };
      let cnv;

      p.setup = () => {
        p.clear();

        cnv = p.createCanvas(1, 1);
        cnv.parent(containerRef.current);
        cnv.style("position", "absolute");
        cnv.style("top", "0");
        cnv.style("left", "0");
        cnv.style("width", "100%");
        cnv.style("height", "100%");
        p.frameRate(60);

        const container = containerRef.current;
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        if (width > 0 && height > 0) {
          p.resizeCanvas(width, height);
        }
        canvasCenter = { x: p.width / 2, y: p.height / 2 };
        mousePos = { x: p.width / 2, y: p.height / 2 };
        prevMousePos = { x: p.width / 2, y: p.height / 2 };

        const resizeCanvas = () => {
          const container = containerRef.current;
          if (container) {
            const w = container.offsetWidth;
            const h = container.offsetHeight;
            if (w > 0 && h > 0 && (w !== p.width || h !== p.height)) {
              p.resizeCanvas(w, h);
              canvasCenter = { x: w / 2, y: h / 2 };
            }
          }
        };
        window.addEventListener("resize", resizeCanvas);

        // Keep a reference to the resize listener to remove it
        p.removeResizeListener = () =>
          window.removeEventListener("resize", resizeCanvas);

        shapes = [];
        for (let i = 0; i < cfg.numShapes; i++) {
          shapes.push({
            type: cfg.shapeTypes[p.floor(p.random(cfg.shapeTypes.length))],
            size: p.random(cfg.sizeRange[0], cfg.sizeRange[1]),
            distance: p.random(cfg.distanceRange[0], cfg.distanceRange[1]),
            angle: p.random(p.TWO_PI),
            speed: p.random(cfg.speedRange[0], cfg.speedRange[1]),
            colorHex: cfg.colorPalette[i % cfg.colorPalette.length],
            rotation: p.random(p.TWO_PI),
            rotationSpeed: p.random(-0.02, 0.02),
            wobble: cfg.hasWobble
              ? p.random(cfg.wobbleRange[0], cfg.wobbleRange[1])
              : 0,
            wobbleSpeed: cfg.hasWobble
              ? p.random(cfg.wobbleSpeedRange[0], cfg.wobbleSpeedRange[1])
              : 0,
            baseX: 0,
            baseY: 0,
            offsetX: 0,
            offsetY: 0,
            velX: 0,
            velY: 0,
            springK: p.random(cfg.springKRange[0], cfg.springKRange[1]),
            damping: p.random(cfg.dampingRange[0], cfg.dampingRange[1]),
          });
        }
      };

      p.draw = () => {
        p.clear();
        canvasCenter = { x: p.width / 2, y: p.height / 2 };

        if (cfg.hasMouseInteraction) {
          mouseVel.x = (mousePos.x - prevMousePos.x) * 0.5;
          mouseVel.y = (mousePos.y - prevMousePos.y) * 0.5;
          prevMousePos.x = mousePos.x;
          prevMousePos.y = mousePos.y;
        }

        shapes.forEach((s) => {
          s.angle += s.speed;
          s.rotation += s.rotationSpeed;

          let wobbleOffset = 0;
          if (cfg.hasWobble) {
            wobbleOffset = p.sin(p.frameCount * s.wobbleSpeed) * 8;
          }
          s.baseX =
            canvasCenter.x + p.cos(s.angle) * (s.distance + wobbleOffset);
          s.baseY =
            canvasCenter.y + p.sin(s.angle) * (s.distance + wobbleOffset);

          if (cfg.hasMouseInteraction) {
            let dx = mousePos.x - s.baseX;
            let dy = mousePos.y - s.baseY;
            let dist = p.sqrt(dx * dx + dy * dy);

            if (dist < cfg.influenceRadius) {
              let force = (1 - dist / cfg.influenceRadius) * 0.5;
              let angle = p.atan2(dy, dx);
              let scatterForce = force * cfg.scatterMultiplier;
              let pushX = p.cos(angle) * scatterForce;
              let pushY = p.sin(angle) * scatterForce;
              pushX += mouseVel.x * force * cfg.velocityInfluence;
              pushY += mouseVel.y * force * cfg.velocityInfluence;
              s.offsetX += pushX;
              s.offsetY += pushY;
            }

            let springX = (0 - s.offsetX) * s.springK;
            let springY = (0 - s.offsetY) * s.springK;
            s.velX = (s.velX + springX) * s.damping;
            s.velY = (s.velY + springY) * s.damping;
            s.offsetX += s.velX;
            s.offsetY += s.velY;
          }

          let x = s.baseX + s.offsetX;
          let y = s.baseY + s.offsetY;

          p.push();
          p.translate(x, y);
          p.rotate(s.rotation);

          const fillColor = hexToColor(p, s.colorHex, cfg.fillAlpha);
          p.fill(fillColor);
          p.noStroke();
          p.drawingContext.shadowBlur = cfg.shadowBlur;
          p.drawingContext.shadowColor = cfg.shadowColor;

          let sz = s.size * cfg.sizeMultiplier;
          if (s.type === "circle") {
            p.ellipse(0, 0, sz);
          } else if (s.type === "rect") {
            p.rectMode(p.CENTER);
            p.rect(0, 0, sz, sz);
          } else if (s.type === "diamond") {
            p.beginShape();
            p.vertex(0, -sz / 2);
            p.vertex(sz / 2, 0);
            p.vertex(0, sz / 2);
            p.vertex(-sz / 2, 0);
            p.endShape(p.CLOSE);
          } else {
            p.beginShape();
            for (let i = 0; i < 3; i++) {
              let a = (p.TWO_PI / 3) * i - p.HALF_PI;
              p.vertex((p.cos(a) * sz) / 2, (p.sin(a) * sz) / 2);
            }
            p.endShape(p.CLOSE);
          }
          p.pop();
        });
      };

      if (cfg.hasMouseInteraction) {
        p.mouseMoved = () => {
          mousePos.x = p.mouseX;
          mousePos.y = p.mouseY;
        };
        p.mouseDragged = () => {
          mousePos.x = p.mouseX;
          mousePos.y = p.mouseY;
        };
      }
    };

    const p5Instance = new p5(sketch);
    p5Ref.current = p5Instance;

    return () => {
      if (p5Ref.current) {
        console.log("remove existing orbits");

        p5Ref.current.removeResizeListener?.();
        p5Ref.current.remove();
        p5Ref.current = null;
      }

      // Ensure the container is explicitly cleared of ALL remaining canvas elements
      if (containerRef.current) {
        const canvases = containerRef.current.querySelectorAll("canvas");
        if (canvases.length > 0) {
          console.log(`removing ${canvases.length} canvas(es)`);
          canvases.forEach((canvas) => canvas.remove());
        }
      }
    };
  }, [
    cfg.numShapes,
    cfg.sizeRange,
    cfg.distanceRange,
    cfg.speedRange,
    cfg.shapeTypes,
    cfg.wobbleRange,
    cfg.wobbleSpeedRange,
    cfg.orbitPathRadius,
    cfg.orbitPathStep,
    cfg.shadowBlur,
    cfg.shadowColor,
    cfg.fillAlpha,
    cfg.sizeMultiplier,
    cfg.hasOrbitPaths,
    cfg.hasWobble,
    cfg.hasMouseInteraction,
    cfg.influenceRadius,
    cfg.scatterMultiplier,
    cfg.velocityInfluence,
    cfg.springKRange,
    cfg.dampingRange,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "none", // Fixes touch/scroll hijacking on mobile
        ...style,
      }}
    />
  );
};
