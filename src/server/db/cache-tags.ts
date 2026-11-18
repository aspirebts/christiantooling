/**
 * Cache tags for `"use cache"` data. When administrators change this data
 * (phase 2), call updateTag(CACHE_TAGS.x) in the Server Action so pages
 * refresh immediately.
 */
export const CACHE_TAGS = {
  practiceCategories: "practice-categories",
  technologyTypes: "technology-types",
  skills: "skills",
} as const;
