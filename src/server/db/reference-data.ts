import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Enums, Tables } from "@/types/database.types";

import { CACHE_TAGS } from "./cache-tags";

/*
 * Public reference data (categories, technology types, skills).
 *
 * These are cached with "use cache" and read through the cookie-less public
 * client, so they become part of static page shells and are shared by every
 * visitor. In safe local mode they return { configured: false } instead of
 * failing. Unexpected database errors throw so a failure is never cached.
 */

export type ReferenceList<T> = { configured: boolean; items: T[] };

export type PracticeCategory = Pick<
  Tables<"practice_categories">,
  "id" | "slug" | "name" | "description" | "icon"
>;

export type TechnologyType = Pick<
  Tables<"technology_types">,
  "id" | "slug" | "name" | "description" | "icon"
>;

export type Skill = Pick<Tables<"skills">, "id" | "slug" | "name" | "category" | "description">;
export type SkillCategory = Enums<"skill_category">;

export async function getPracticeCategories(): Promise<ReferenceList<PracticeCategory>> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.practiceCategories);

  if (!isSupabaseConfigured()) return { configured: false, items: [] };

  const { data, error } = await createPublicClient()
    .from("practice_categories")
    .select("id, slug, name, description, icon")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw new Error(`Could not load practice categories (${error.code}).`);
  return { configured: true, items: data };
}

export async function getTechnologyTypes(): Promise<ReferenceList<TechnologyType>> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.technologyTypes);

  if (!isSupabaseConfigured()) return { configured: false, items: [] };

  const { data, error } = await createPublicClient()
    .from("technology_types")
    .select("id, slug, name, description, icon")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw new Error(`Could not load technology types (${error.code}).`);
  return { configured: true, items: data };
}

export async function getSkills(): Promise<ReferenceList<Skill>> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.skills);

  if (!isSupabaseConfigured()) return { configured: false, items: [] };

  const { data, error } = await createPublicClient()
    .from("skills")
    .select("id, slug, name, category, description")
    .eq("is_active", true)
    .order("category")
    .order("sort_order");

  if (error) throw new Error(`Could not load skills (${error.code}).`);
  return { configured: true, items: data };
}
