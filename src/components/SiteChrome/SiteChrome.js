import "./SiteChrome.scss";
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Signature } from "../Signature";

// Resets scroll on navigation, or scrolls to the #hash target when there is one.
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Give the destination page a beat to render its sections.
      const t = setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

// Top-left breadcrumb used on pages outside the home page.
export function SiteNav({ crumbs = [] }) {
  return (
    <nav className="site-nav" aria-label="Breadcrumb">
      <Link to="/">
        <h5>jared stock</h5>
      </Link>
      {crumbs.map((c) => (
        <React.Fragment key={c.to}>
          <span className="site-nav-sep">/</span>
          <Link to={c.to}>
            <h5>{c.label}</h5>
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer site-footer">
      <Signature />
      <div className="site-footer-line">
        <Link to="/">
          <h4>Jared Stock</h4>
        </Link>
        <span> | 2026 | NYC</span>
      </div>
    </footer>
  );
}

// Sets the tab title while the page is mounted.
export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
