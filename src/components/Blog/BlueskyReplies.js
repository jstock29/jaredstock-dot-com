import React, { useEffect, useState } from "react";
import { BlueskyIcon } from "./ShareBar";

// Comments without running a comment system: replies to the Bluesky post that shared an
// article are read from Bluesky's public API (no account, key or server needed) and
// shown under it. Moderation happens on Bluesky: hide a reply there and it disappears
// here too, and replies Bluesky labels as unsafe are skipped.
const API = "https://public.api.bsky.app/xrpc";
const POST_URL = /^https:\/\/bsky\.app\/profile\/([^/]+)\/post\/([a-z0-9]+)/i;
const HIDDEN_LABELS = new Set(["!hide", "!warn", "porn", "sexual", "nudity", "graphic-media", "gore"]);
const MAX_DEPTH = 3;

async function xrpc(method, params) {
  const res = await fetch(`${API}/${method}?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error(`${method} ${res.status}`);
  return res.json();
}

async function toAtUri(url) {
  const match = POST_URL.exec(url || "");
  if (!match) return null;
  const [, actor, rkey] = match;
  const did = actor.startsWith("did:") ? actor : (await xrpc("com.atproto.identity.resolveHandle", { handle: actor })).did;
  return `at://${did}/app.bsky.feed.post/${rkey}`;
}

const postUrl = (post) => `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").pop()}`;
const isVisible = (node, hidden) =>
  node?.$type === "app.bsky.feed.defs#threadViewPost" &&
  !hidden.has(node.post.uri) &&
  ![...(node.post.labels || []), ...(node.post.author.labels || [])].some((l) => HIDDEN_LABELS.has(l.val));

// Bluesky facets mark links, mentions and hashtags by UTF-8 byte offsets.
function RichText({ record }) {
  const text = record?.text || "";
  const facets = [...(record?.facets || [])].sort((a, b) => a.index.byteStart - b.index.byteStart);
  if (!facets.length) return text;
  const bytes = new TextEncoder().encode(text);
  const decode = (a, b) => new TextDecoder().decode(bytes.slice(a, b));
  const out = [];
  let cursor = 0;
  facets.forEach((facet, i) => {
    const { byteStart, byteEnd } = facet.index;
    if (byteStart < cursor) return;
    out.push(decode(cursor, byteStart));
    const feature = facet.features?.[0] || {};
    const label = decode(byteStart, byteEnd);
    const href =
      feature.$type === "app.bsky.richtext.facet#link"
        ? feature.uri
        : feature.$type === "app.bsky.richtext.facet#mention"
          ? `https://bsky.app/profile/${feature.did}`
          : feature.$type === "app.bsky.richtext.facet#tag"
            ? `https://bsky.app/hashtag/${encodeURIComponent(feature.tag)}`
            : null;
    out.push(
      href && /^https:\/\//.test(href) ? (
        <a key={i} href={href} target="_blank" rel="noreferrer nofollow ugc">
          {label}
        </a>
      ) : (
        label
      ),
    );
    cursor = byteEnd;
  });
  out.push(decode(cursor));
  return out;
}

function timeAgo(iso) {
  const seconds = (Date.now() - new Date(iso)) / 1000;
  const steps = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (value < size) return `${Math.max(1, Math.floor(value))}${unit}`;
    value /= size;
  }
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Reply({ node, hidden, depth }) {
  const { post } = node;
  const children = (node.replies || [])
    .filter((r) => isVisible(r, hidden))
    .sort((a, b) => (b.post.likeCount || 0) - (a.post.likeCount || 0));
  return (
    <li className="bsky-reply">
      <div className="bsky-reply-head">
        <a href={`https://bsky.app/profile/${post.author.handle}`} target="_blank" rel="noreferrer" className="bsky-reply-author">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt="" loading="lazy" width="32" height="32" />
          ) : (
            <span className="bsky-reply-avatar-blank" />
          )}
          <span className="bsky-reply-name">{post.author.displayName || post.author.handle}</span>
          <span className="bsky-reply-handle">@{post.author.handle}</span>
        </a>
        <a href={postUrl(post)} target="_blank" rel="noreferrer" className="bsky-reply-time">
          <time dateTime={post.record?.createdAt}>{timeAgo(post.record?.createdAt || post.indexedAt)}</time>
        </a>
      </div>
      <p className="bsky-reply-text">
        <RichText record={post.record} />
      </p>
      {post.likeCount > 0 && <span className="bsky-reply-likes" aria-label={`${post.likeCount} likes`}>♥ {post.likeCount}</span>}
      {children.length > 0 && depth < MAX_DEPTH && (
        <ul className="bsky-replies-nested">
          {children.map((child) => (
            <Reply key={child.post.uri} node={child} hidden={hidden} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function BlueskyReplies({ url }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;
    toAtUri(url)
      .then((uri) => (uri ? xrpc("app.bsky.feed.getPostThread", { uri, depth: String(MAX_DEPTH + 1), parentHeight: "0" }) : null))
      .then((data) => !cancelled && setState({ loading: false, thread: data?.thread, threadgate: data?.threadgate }))
      .catch(() => !cancelled && setState({ loading: false, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [url]);

  const { thread } = state;
  if (state.loading || state.failed || thread?.$type !== "app.bsky.feed.defs#threadViewPost") return null;

  // Replies the author hid with Bluesky's "Hide reply" live in the thread's threadgate.
  const gate = thread.post.threadgate || state.threadgate;
  const hidden = new Set(gate?.record?.hiddenReplies || []);
  const replies = (thread.replies || [])
    .filter((r) => isVisible(r, hidden))
    .sort((a, b) => (b.post.likeCount || 0) - (a.post.likeCount || 0));
  const { post } = thread;
  const link = postUrl(post);

  return (
    <section className="bsky" aria-label="Replies on Bluesky">
      <div className="bsky-head">
        <a href={link} target="_blank" rel="noreferrer" className="bsky-stats">
          <BlueskyIcon />
          <span aria-label={`${post.likeCount || 0} likes`}>♥ {post.likeCount || 0}</span>
          <span aria-label={`${post.repostCount || 0} reposts`}>↻ {post.repostCount || 0}</span>
          <span aria-label={`${post.replyCount || 0} replies`}>↩ {post.replyCount || 0}</span>
        </a>
        <a href={link} target="_blank" rel="noreferrer" className="bsky-cta">
          reply on bluesky →
        </a>
      </div>
      {replies.length > 0 && (
        <ul className="bsky-replies">
          {replies.map((node) => (
            <Reply key={node.post.uri} node={node} hidden={hidden} depth={1} />
          ))}
        </ul>
      )}
    </section>
  );
}
