import React, { useRef, useEffect } from "react";
import p5 from "p5";

export const SnowAccumulator = ({ className, style, isActive }) => {
  const containerRef = useRef(null);
  const p5Ref = useRef(null);
  const isActiveRef = useRef(isActive);

  // Keep the active state ref updated so the p5 draw loop can read it dynamically
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Defensively clear any existing canvases in the container to avoid duplicates
    const existingCanvases = containerRef.current.querySelectorAll("canvas");
    if (existingCanvases.length > 0) {
      console.log(`[SnowAccumulator] Force-clearing ${existingCanvases.length} lingering canvas(es)`);
      existingCanvases.forEach((c) => c.remove());
    }

    const sketch = (p) => {
      let flakes = [];
      const colors = ["#09306B", "#4F83D1", "#BAA22B", "#D5C471"];
      let wasActive = false;

      // Physics configuration
      const MAX_SHAPES = 150;
      const gravity = 0.15;          // Gravity acceleration
      const friction = 0.985;        // Air resistance damping
      const bounce = 0.15;            // Bounce elasticity
      const groundFriction = 0.82;   // Friction when touching floor
      const physicsSteps = 3;        // Sub-steps per frame for simulation stability

      const createFlake = () => {
        const size = p.random(12, 28);
        const radius = size / 2;
        return {
          x: p.random(radius, p.width - radius),
          y: -radius,
          vx: p.random(-0.5, 0.5),
          vy: p.random(1, 2),
          size: size,
          radius: radius,
          mass: radius * radius, // Mass proportional to area
          color: p.random(colors),
          type: p.random(["circle", "rect", "diamond", "triangle"]),
        };
      };

      p.setup = () => {
        p.clear();
        
        // Initialize as 1x1 canvas styled to fill parent, then resize to match container
        const cnv = p.createCanvas(1, 1);
        cnv.parent(containerRef.current);
        cnv.style("position", "absolute");
        cnv.style("top", "0");
        cnv.style("left", "0");
        cnv.style("width", "100%");
        cnv.style("height", "100%");
        p.frameRate(60);

        const container = containerRef.current;
        if (container) {
          const w = container.offsetWidth;
          const h = container.offsetHeight;
          if (w > 0 && h > 0) {
            p.resizeCanvas(w, h);
          }
        }
      };

      const resizeCanvas = () => {
        const container = containerRef.current;
        if (container) {
          const w = container.offsetWidth;
          const h = container.offsetHeight;
          if (w > 0 && h > 0 && (w !== p.width || h !== p.height)) {
            p.resizeCanvas(w, h);
          }
        }
      };

      window.addEventListener("resize", resizeCanvas);
      p.removeResizeListener = () => {
        window.removeEventListener("resize", resizeCanvas);
      };

      p.draw = () => {
        p.clear();

        const active = isActiveRef.current;

        // If toggled from active to inactive, clear all shapes
        if (wasActive && !active) {
          flakes = [];
        }
        wasActive = active;

        // Spawn shapes if active at a gentler rate
        if (active && p.random() < 0.04) {
          flakes.push(createFlake());
          if (flakes.length > MAX_SHAPES) {
            flakes.shift(); // Remove oldest shape to maintain performance
          }
        }

        // Sub-stepping loop: running physics multiple times per frame prevents tunneling
        const dt = 1.0 / physicsSteps;
        for (let step = 0; step < physicsSteps; step++) {
          
          // 1. Apply gravity, mouse forces, and update positions
          for (let s of flakes) {
            s.vy += gravity * dt;

            // Mouse repel interaction (applying force vectors)
            const d = p.dist(p.mouseX, p.mouseY, s.x, s.y);
            const repelRadius = 85;
            if (d < repelRadius && d > 0.1) {
              const force = (repelRadius - d) / repelRadius;
              const angle = p.atan2(s.y - p.mouseY, s.x - p.mouseX);
              s.vx += p.cos(angle) * force * 1.8 * dt;
              s.vy += p.sin(angle) * force * 1.8 * dt;
            }

            // Update position
            s.x += s.vx * dt;
            s.y += s.vy * dt;

            // Damping/air resistance
            s.vx *= (1 - (1 - friction) * dt);
            s.vy *= (1 - (1 - friction) * dt);
          }

          // 2. Resolve collisions between shapes (2D elastic circle collision)
          for (let i = 0; i < flakes.length; i++) {
            for (let j = i + 1; j < flakes.length; j++) {
              const s1 = flakes[i];
              const s2 = flakes[j];

              const dx = s1.x - s2.x;
              const dy = s1.y - s2.y;
              const dist = p.sqrt(dx * dx + dy * dy);
              const minDist = s1.radius + s2.radius;

              if (dist < minDist) {
                const overlap = minDist - dist;
                
                // Normal direction vector
                const nx = dist > 0.1 ? dx / dist : p.random(-0.5, 0.5);
                const ny = dist > 0.1 ? dy / dist : 1;

                // Push apart based on mass ratio (heavier shapes move less)
                const totalMass = s1.mass + s2.mass;
                const ratio1 = s2.mass / totalMass;

                s1.x += nx * overlap * ratio1;
                s1.y += ny * overlap * ratio1;
                s2.x -= nx * overlap * (1 - ratio1);
                s2.y -= ny * overlap * (1 - ratio1);

                // Calculate relative velocity along the normal vector
                const kx = s1.vx - s2.vx;
                const ky = s1.vy - s2.vy;
                const vn = kx * nx + ky * ny;

                // Resolve velocities if moving towards each other
                if (vn < 0) {
                  // Restitution threshold: prevent jitter by only bouncing if velocity is substantial
                  const restitution = p.abs(vn) > 0.5 ? 0.15 : 0.0;
                  const impulse = -(1 + restitution) * vn / (1 / s1.mass + 1 / s2.mass);

                  s1.vx += (impulse / s1.mass) * nx;
                  s1.vy += (impulse / s1.mass) * ny;
                  s2.vx -= (impulse / s2.mass) * nx;
                  s2.vy -= (impulse / s2.mass) * ny;
                }

                // Contact friction: slows sliding shapes so they settle stably
                s1.vx *= 0.985;
                s1.vy *= 0.985;
                s2.vx *= 0.985;
                s2.vy *= 0.985;
              }
            }
          }

          // 3. Enforce boundary constraints (Floor and Walls)
          for (let s of flakes) {
            // Bottom boundary (floor)
            if (s.y > p.height - s.radius) {
              s.y = p.height - s.radius;
              // Snapping velocity to zero at low speeds to prevent endless micro-bouncing/jittering
              if (p.abs(s.vy) > 0.5) {
                s.vy = -s.vy * bounce;
              } else {
                s.vy = 0;
              }
              s.vx *= groundFriction;
            }

            // Left and right walls
            if (s.x < s.radius) {
              s.x = s.radius;
              s.vx = -s.vx * bounce;
            } else if (s.x > p.width - s.radius) {
              s.x = p.width - s.radius;
              s.vx = -s.vx * bounce;
            }
          }
        }

        // 4. Draw all shapes
        for (let s of flakes) {
          drawShape(p, s.x, s.y, s.size, s.color, s.type);
        }
      };

      function drawShape(p, x, y, size, color, type) {
        p.fill(color);
        p.noStroke();
        p.push();
        p.translate(x, y);

        if (type === "circle") {
          p.ellipse(0, 0, size);
        } else if (type === "rect") {
          p.rectMode(p.CENTER);
          p.rect(0, 0, size, size);
        } else if (type === "triangle") {
          p.beginShape();
          p.vertex(0, -size / 2);
          p.vertex(size / 2, size / 2);
          p.vertex(-size / 2, size / 2);
          p.endShape(p.CLOSE);
        } else {
          p.beginShape();
          p.vertex(0, -size / 2);
          p.vertex(size / 2, 0);
          p.vertex(0, size / 2);
          p.vertex(-size / 2, 0);
          p.endShape(p.CLOSE);
        }
        p.pop();
      }
    };

    const p5Instance = new p5(sketch);
    p5Ref.current = p5Instance;

    return () => {
      if (p5Ref.current) {
        p5Ref.current.removeResizeListener?.();
        p5Ref.current.remove();
        p5Ref.current = null;
      }
      if (containerRef.current) {
        const canvases = containerRef.current.querySelectorAll("canvas");
        canvases.forEach((canvas) => canvas.remove());
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        left: 0,
        ...style,
      }}
    />
  );
};
