import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRevealOnScroll } from "../../../hooks/useRevealOnScroll";
import { isVideoUrl, toEmbedUrl } from "../../../data/projects";

// Media sits in the prose column by default; "wide" and "full" break out of it.
const widthClass = (width) => `block-width-${width || "column"}`;

export function Media({ src, alt = "", poster, video, autoplay = true, controls }) {
  if (!src) return null;
  if (video || isVideoUrl(src)) {
    // Autoplaying, looping, muted video is how "gifs" should be stored: far smaller files.
    return autoplay ? (
      <video src={src} poster={poster} autoPlay loop muted playsInline preload="metadata" aria-label={alt} />
    ) : (
      <video src={src} poster={poster} controls={controls ?? true} playsInline preload="metadata" aria-label={alt} />
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" />;
}

function Caption({ children }) {
  if (!children) return null;
  return <figcaption>{children}</figcaption>;
}

function TextBlock({ block }) {
  return (
    <div className="block-text">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {block.md || ""}
      </Markdown>
    </div>
  );
}

function MediaBlock({ block }) {
  return (
    <figure className={`block-media ${widthClass(block.width)}`}>
      <Media
        src={block.src}
        alt={block.alt}
        poster={block.poster}
        video={block.type === "video"}
        autoplay={block.type !== "video" || block.autoplay !== false}
      />
      <Caption>{block.caption}</Caption>
    </figure>
  );
}

function GalleryBlock({ block }) {
  const items = block.items || [];
  return (
    <figure className={`block-gallery ${widthClass(block.width || "wide")}`}>
      <div className="block-gallery-grid" style={{ "--gallery-columns": block.columns || 2 }}>
        {items.map((item, i) => (
          <figure key={item.src || i} className="block-gallery-item">
            <Media src={item.src} alt={item.alt} />
            <Caption>{item.caption}</Caption>
          </figure>
        ))}
      </div>
      <Caption>{block.caption}</Caption>
    </figure>
  );
}

function EmbedBlock({ block }) {
  const src = toEmbedUrl(block.url);
  if (!src) return null;
  return (
    <figure className={`block-embed ${widthClass(block.width || "wide")}`}>
      <div className="block-embed-frame">
        <iframe
          src={src}
          title={block.caption || "Embedded media"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
      <Caption>{block.caption}</Caption>
    </figure>
  );
}

function QuoteBlock({ block }) {
  return (
    <blockquote className="block-quote">
      <p>{block.text}</p>
      {block.cite && <cite>— {block.cite}</cite>}
    </blockquote>
  );
}

const BLOCKS = {
  text: TextBlock,
  image: MediaBlock,
  video: MediaBlock,
  gallery: GalleryBlock,
  embed: EmbedBlock,
  quote: QuoteBlock,
};

function Reveal({ children }) {
  const [ref, isVisible] = useRevealOnScroll(0.08);
  return (
    <div ref={ref} className={`block-reveal ${isVisible ? "block-reveal-visible" : ""}`}>
      {children}
    </div>
  );
}

export function BlockRenderer({ blocks = [] }) {
  return blocks.map((block, i) => {
    const Component = BLOCKS[block.type];
    if (!Component) return null;
    return (
      <Reveal key={block.id || i}>
        <Component block={block} />
      </Reveal>
    );
  });
}
