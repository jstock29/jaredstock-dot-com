import "./SiteChrome.scss";
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Signature } from "../Signature";
import { useSettings } from "../../data/settings";

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
  const settings = useSettings();
  return (
    <nav className="site-nav" aria-label="Breadcrumb">
      <Link to="/" className="site-nav-link">
        {settings?.name ?? "\u00a0"}
      </Link>
      {crumbs.map((c) => (
        <React.Fragment key={c.to}>
          <span className="site-nav-sep">/</span>
          <Link to={c.to} className="site-nav-link">
            {c.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}

export function SiteFooter() {
  const settings = useSettings();
  if (!settings) return null;
  return (
    <div className="footer site-footer">
      <Signature />
      <div className="site-footer-line">
        <Link to="/" className="site-footer-name">
          {settings.footer.name}
        </Link>
        <span>
          {" "}| {new Date().getFullYear()} | {settings.footer.location}
        </span>
      </div>
    </div>
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
