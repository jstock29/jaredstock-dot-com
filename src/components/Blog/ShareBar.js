import React, { useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";
import LinkIcon from "@mui/icons-material/Link";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import CheckIcon from "@mui/icons-material/Check";

export function BlueskyIcon(props) {
  return (
    <svg viewBox="0 0 600 530" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M135.72 44.03C202.22 93.95 273.75 195.17 300 249.49c26.26-54.32 97.78-155.54 164.28-205.46C512.26 8.02 590-19.84 590 68.86c0 17.72-10.16 148.82-16.12 170.11-20.7 74.01-96.13 92.88-163.24 81.46 117.3 19.97 147.14 86.1 82.7 152.23-122.4 125.6-175.92-31.52-189.64-71.78-2.51-7.38-3.69-10.83-3.7-7.9-.02-2.93-1.2.52-3.7 7.9-13.71 40.26-67.23 197.38-189.64 71.78-64.45-66.13-34.6-132.26 82.7-152.23-67.1 11.42-142.54-7.45-163.24-81.46C20.16 217.68 10 86.58 10 68.86c0-88.7 77.74-60.84 125.72-24.83z" />
    </svg>
  );
}

// Plain links to each network's own compose screen: no third-party scripts or trackers.
// The rich card (title, hero image) comes from the post's pre-rendered preview tags.
export default function ShareBar({ title, url }) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setCanShare(typeof navigator !== "undefined" && Boolean(navigator.share)), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  const links = [
    {
      label: "Share on Bluesky",
      icon: <BlueskyIcon style={{ fontSize: 20 }} />,
      href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      label: "Share on LinkedIn",
      icon: <LinkedInIcon style={{ fontSize: 22 }} />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="blog-share" role="group" aria-label="Share">
      {canShare && (
        <Tooltip title="Share">
          <IconButton aria-label="Share" onClick={() => navigator.share({ title, url }).catch(() => {})}>
            <IosShareIcon style={{ fontSize: 21 }} />
          </IconButton>
        </Tooltip>
      )}
      {links.map((l) => (
        <Tooltip key={l.label} title={l.label}>
          <IconButton component="a" href={l.href} target="_blank" rel="noreferrer" aria-label={l.label}>
            {l.icon}
          </IconButton>
        </Tooltip>
      ))}
      <Tooltip title={copied ? "Copied" : "Copy link"}>
        <IconButton aria-label={copied ? "Link copied" : "Copy link"} onClick={copy}>
          {copied ? <CheckIcon style={{ fontSize: 21 }} /> : <LinkIcon style={{ fontSize: 22 }} />}
        </IconButton>
      </Tooltip>
    </div>
  );
}
