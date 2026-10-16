import React, { useState } from "react";
import { Link } from "react-router-dom";
import { SECTION_KEYS } from "../../data/settings";
import { entryPath } from "../../data/content";

// The home page's section links: pinned top-left on desktop, behind a toggle on phones.
export function HomeNav({ sections, pages = [] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const items = [
    ...SECTION_KEYS.filter((key) => sections[key].show).map((key) => (
      <a key={key} href={`#${key}`} onClick={close}>
        <h5>{sections[key].title}</h5>
      </a>
    )),
    ...pages.map((page) => (
      <Link key={page.id} to={entryPath("pages", page)} onClick={close}>
        <h5>{page.navLabel || page.title}</h5>
      </Link>
    )),
  ];

  return (
    <nav className={`anchors ${open ? "anchors-open" : ""}`} aria-label="Sections">
      <button
        type="button"
        className="anchors-toggle"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="anchors-links">
        {items.map((item) => (
          <div key={item.key}>{item}</div>
        ))}
      </div>
    </nav>
  );
}
