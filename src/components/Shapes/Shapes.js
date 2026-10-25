import "./Shapes.scss";

// A few decorative shapes that drift slowly in a corner of a section. Purely visual:
// hidden from assistive tech, never catches a tap, and still when motion is reduced.
// shapes: [{ type: "circle" | "diamond" | "triangle" | "ring" | "square", size, color, top|bottom, left|right, delay }]
export default function Shapes({ shapes = [] }) {
  return (
    <div className="shapes" aria-hidden="true">
      {shapes.map(({ type = "circle", size = 24, color = "navy-light", delay = 0, ...pos }, i) => (
        <span
          key={i}
          className={`shape shape-${type} shape-${color}`}
          style={{ width: size, height: size, animationDelay: `${delay}s`, ...pos }}
        />
      ))}
    </div>
  );
}
