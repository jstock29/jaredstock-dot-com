// Project-specific shortcuts over the generic content helpers.
import { entryPath, getEntries, getEntryBySlug } from "./content";

export { slugify, isPublished, toEmbedUrl, isVideoUrl } from "./content";

export const getProjects = (options) => getEntries("projects", options);
export const projectPath = (project) => entryPath("projects", project);

export async function getProjectBySlug(slug, options) {
  const { entry, prev, next } = await getEntryBySlug("projects", slug, options);
  return { project: entry, prev, next };
}
