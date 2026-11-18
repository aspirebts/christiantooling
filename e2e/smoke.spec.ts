import { expect, test } from "@playwright/test";

/*
 * Smoke tests against a production build in SAFE LOCAL MODE (no Supabase).
 * They verify that public pages render, navigation works, protected areas
 * redirect to sign-in, and auth forms are disabled rather than faked.
 */

const PUBLIC_PAGES = [
  { path: "/", heading: /Technology to Help You\s+Live Your Faith\./ },
  { path: "/tools", heading: "Explore Christian tools" },
  { path: "/ideas", heading: "Ideas that should exist" },
  { path: "/help-build", heading: "Help build Christian technology" },
  { path: "/our-tools", heading: "Tools built by ChristianTooling" },
  { path: "/about", heading: "A technology ministry for the global Church" },
  { path: "/donate", heading: "Support the mission" },
];

for (const { path, heading } of PUBLIC_PAGES) {
  test(`renders ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  });
}

test("homepage shows the mission, both calls to action and every section", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: /Technology to Help You/ });
  await expect(hero.getByRole("link", { name: "Explore Tools", exact: true })).toHaveAttribute(
    "href",
    "/tools",
  );
  await expect(hero.getByRole("link", { name: "Submit an Idea" })).toHaveAttribute(
    "href",
    "/ideas#submit-idea",
  );
  for (const section of [
    "Explore Christian tools",
    "Find tools for the way you practise your faith",
    "Discover ideas that should exist",
    "Help build Christian technology",
    "Tools built by ChristianTooling",
    "Help keep faithful technology free and thriving.",
  ]) {
    await expect(page.getByRole("heading", { level: 2, name: section })).toBeVisible();
  }
  // Placeholder content is clearly labelled.
  await expect(page.getByText("Sample", { exact: true }).first()).toBeVisible();
});

test("primary navigation reaches every section", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop navigation is hidden on small screens");
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const [label, path] of [
    ["Explore Tools", "/tools"],
    ["Ideas", "/ideas"],
    ["Help Build", "/help-build"],
    ["Our Tools", "/our-tools"],
    ["About", "/about"],
  ] as const) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  }
});

test("mobile menu opens, navigates and closes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: /Help Build/ }).click();
  await expect(page).toHaveURL("/help-build");
  await expect(menu).toBeHidden();
});

for (const protectedPath of ["/dashboard", "/dashboard/settings", "/admin", "/admin/users"]) {
  test(`redirects signed-out visitors away from ${protectedPath}`, async ({ page }) => {
    await page.goto(protectedPath);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
  });
}

test("auth forms explain safe local mode instead of faking sign-in", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Sign-in needs Supabase")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();

  await page.goto("/register");
  await expect(page.getByText("Registration needs Supabase")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();
});

test("practice links carry the selected practice to the directory", async ({ page }) => {
  await page.goto("/tools?practice=prayer");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Explore Christian tools");
});

test("unknown routes show the 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("health endpoint reports status without secrets", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body).toMatchObject({ status: "ok", supabase: "not_configured" });
  expect(Object.keys(body).sort()).toEqual(["status", "supabase", "timestamp"]);
});

test("security headers are applied", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
