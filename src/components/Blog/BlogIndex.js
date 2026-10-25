import "../EntryPage/EntryPage.scss";
import "./Blog.scss";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import RssFeedIcon from "@mui/icons-material/RssFeed";
import { entryPath, formatDate, getEntries, readingStats, shareDescription, shareImage } from "../../data/content";
import { useSettings } from "../../data/settings";
import { SiteFooter, SiteNav, useDocumentTitle } from "../SiteChrome/SiteChrome";

function PostCard({ post, featured }) {
  const image = shareImage(post);
  const { minutes } = readingStats(post.blocks);
  return (
    <li className={`blog-card ${featured ? "blog-card-featured" : ""}`}>
      <Link to={entryPath("posts", post)}>
        {image && (
          <div className="blog-card-image">
            <img src={image} alt="" loading={featured ? "eager" : "lazy"} decoding="async" />
          </div>
        )}
        <div className="blog-card-text">
          <p className="blog-post-meta">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> · {minutes} min read
          </p>
          <h2 className="blog-card-title">{post.title}</h2>
          <p className="blog-card-description">{shareDescription(post)}</p>
        </div>
      </Link>
    </li>
  );
}

export default function BlogIndex() {
  const settings = useSettings();
  const [posts, setPosts] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getEntries("posts").then(setPosts, () => setFailed(true));
  }, []);

  const title = settings?.blog.title;
  useDocumentTitle(title || null);

  return (
    <main className="project-page blog-index">
      <SiteNav />
      <header className="blog-index-header">
        <h1 className="blog-index-title">{title ?? " "}</h1>
        {settings?.blog.description && <p className="blog-post-subtitle">{settings.blog.description}</p>}
        <a href="/blog/feed.xml" className="link-icon blog-index-rss" aria-label="RSS feed">
          <RssFeedIcon style={{ fontSize: 20 }} />
        </a>
      </header>

      {failed ? (
        <p className="blog-index-status">Couldn't load posts.</p>
      ) : !posts ? (
        <div className="blog-index-status">
          <CircularProgress sx={{ color: "var(--navy)" }} />
        </div>
      ) : (
        <ul className="blog-index-list">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} featured={i === 0} />
          ))}
        </ul>
      )}

      <SiteFooter />
    </main>
  );
}
