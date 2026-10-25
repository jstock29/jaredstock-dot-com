import "../EntryPage/EntryPage.scss";
import "./Blog.scss";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { entryPath, entrySlug, formatDate, getEntries, isPublished, readingStats } from "../../data/content";
import { useSettings } from "../../data/settings";
import { usePreviewMode } from "../../hooks/usePreviewMode";
import { SiteFooter, SiteNav, useDocumentTitle } from "../SiteChrome/SiteChrome";
import { BlockRenderer, Media } from "../EntryPage/blocks/Blocks";
import BlueskyReplies from "./BlueskyReplies";
import ShareBar from "./ShareBar";

const SITE = "https://jaredstock.com";

// The post itself: header, hero and body. Also used for the admin's preview.
export function PostArticle({ post }) {
  const { minutes } = readingStats(post.blocks);
  const hero = post.hero?.src ? post.hero : null;
  return (
    <article className="blog-post">
      <header className="blog-post-header">
        {!isPublished(post) && <span className="project-page-draft">draft</span>}
        <h1 className="blog-post-title">{post.title}</h1>
        {post.tagline && <p className="blog-post-subtitle">{post.tagline}</p>}
        <p className="blog-post-meta">
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
          {post.publishedAt && " · "}
          {minutes} min read
        </p>
      </header>

      {hero && (
        <figure className="blog-post-hero block-width-wide">
          <Media src={hero.src} alt={hero.alt || ""} poster={hero.poster} video={hero.type === "video"} />
          {hero.caption && <figcaption>{hero.caption}</figcaption>}
        </figure>
      )}

      <div className="project-page-body blog-post-body">
        <BlockRenderer blocks={post.blocks || []} reveal={false} demoteHeadings />
      </div>
    </article>
  );
}

export default function PostPage() {
  const { slug } = useParams();
  const { ready, preview } = usePreviewMode();
  const [state, setState] = useState({ loading: true });
  const settings = useSettings();
  const blogTitle = settings?.blog.title || "blog";

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setState({ loading: true });
    getEntries("posts", { includeDrafts: preview, fresh: preview })
      .then((posts) => {
        const index = posts.findIndex((p) => entrySlug(p) === slug);
        if (cancelled) return;
        // Newest first, so the newer post is the one before this in the list.
        setState({ loading: false, post: posts[index] ?? null, newer: posts[index - 1], older: posts[index + 1] });
      })
      .catch((error) => !cancelled && setState({ loading: false, error }));
    return () => {
      cancelled = true;
    };
  }, [slug, ready, preview]);

  const { loading, post, newer, older, error } = state;
  useDocumentTitle(post ? `${post.title} · ${blogTitle}` : null);
  const crumbs = [{ to: "/blog", label: blogTitle.toLowerCase() }];

  if (loading || error || !post) {
    return (
      <div className="project-page project-page-status">
        <SiteNav crumbs={crumbs} />
        {loading ? (
          <CircularProgress sx={{ color: "var(--navy)" }} />
        ) : (
          <>
            <h1 className="section-title">lost in space</h1>
            <p>{error ? "Couldn't load this page." : "There's nothing here."}</p>
            <Link to="/blog" className="project-page-cta">
              back →
            </Link>
          </>
        )}
      </div>
    );
  }

  const url = `${SITE}${entryPath("posts", post)}`;

  return (
    <div className="project-page blog-post-page">
      <SiteNav crumbs={crumbs} />
      <PostArticle post={post} />

      <footer className="blog-post-footer">
        <ShareBar title={post.title} url={url} />
        {post.blueskyPost && <BlueskyReplies url={post.blueskyPost} />}
      </footer>

      {(newer || older) && (
        <nav className="project-page-pager" aria-label="More posts">
          {older ? (
            <Link to={entryPath("posts", older)}>
              <span className="project-page-pager-label">← older</span>
              <span className="project-page-pager-title">{older.title}</span>
            </Link>
          ) : (
            <span />
          )}
          <Link to="/blog" className="project-page-pager-center" aria-label="All posts">
            <span className="project-page-pager-sun" />
          </Link>
          {newer ? (
            <Link to={entryPath("posts", newer)} className="project-page-pager-next">
              <span className="project-page-pager-label">newer →</span>
              <span className="project-page-pager-title">{newer.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      <SiteFooter />
    </div>
  );
}
