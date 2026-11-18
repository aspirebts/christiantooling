import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/*
 * Full-stack authentication and RBAC journey against the LOCAL Supabase stack.
 *
 *   npm run db:start
 *   E2E_FULL_STACK=1 E2E_SUPABASE_SERVICE_ROLE_KEY=<from `npx supabase status -o env`> npm run test:e2e
 *
 * Creates real users (with unique emails) in the local database. Reset it
 * with `npm run db:reset`. Never run this against a hosted project.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? "";
const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

test.describe.configure({ mode: "serial" });
test.skip(!SERVICE_ROLE_KEY, "Set E2E_SUPABASE_SERVICE_ROLE_KEY (npx supabase status -o env)");
test.skip(
  !/^http:\/\/(127\.0\.0\.1|localhost)/.test(SUPABASE_URL),
  "Full-stack tests only run against a local stack",
);

const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || "missing", {
  auth: { persistSession: false, autoRefreshToken: false },
});

const runId = Date.now().toString(36);
const member = {
  name: "Mary Member",
  email: `mary.${runId}@example.test`,
  password: "faithful-path-1",
  newPassword: "steadfast-path-2",
};
const other = {
  name: `Oscar ${runId}`,
  email: `oscar.${runId}@example.test`,
  password: "another-path-3",
};

type MailpitSummary = { ID: string; Subject: string };

/** Polls Mailpit for an email and returns the /auth/confirm path it links to. */
async function confirmationPath(email: string, subject: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const search = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
    );
    const { messages = [] } = (await search.json()) as { messages?: MailpitSummary[] };
    const message = messages.find((item) => item.Subject.includes(subject));
    if (message) {
      const detail = (await (
        await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)
      ).json()) as { HTML: string };
      const href = detail.HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1];
      if (href) {
        const url = new URL(href.replaceAll("&amp;", "&"));
        return `${url.pathname}${url.search}`; // the app under test runs on another port
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No "${subject}" email arrived for ${email}`);
}

async function signIn(
  page: Page,
  email: string,
  password: string,
  next?: string,
  expectSuccess = true,
) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for the Server Action's redirect before navigating anywhere else.
  if (expectSuccess) await page.waitForURL((url) => url.pathname !== "/login");
}

async function signOutFromDashboard(page: Page) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
}

test("registers, receives the confirmation email and lands on the dashboard", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill(member.name);
  await page.getByLabel("Email").fill(member.email);
  await page.getByLabel("Password", { exact: true }).fill(member.password);
  await page.getByLabel("Confirm password").fill(member.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Check your inbox")).toBeVisible();

  await page.goto(await confirmationPath(member.email, "Confirm your ChristianTooling account"));
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Welcome, ${member.name}`);
  await expect(page.getByText("Registered User", { exact: true }).first()).toBeVisible();
});

test("updates the profile and account preferences", async ({ page }) => {
  await signIn(page, member.email, member.password);
  await expect(page).toHaveURL("/dashboard");

  await page.goto("/dashboard/profile");
  await page.getByLabel("Username").fill(`mary-${runId}`);
  await page.getByLabel("Bio").fill("I build tools that help families pray together.");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Your profile has been saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Username")).toHaveValue(`mary-${runId}`);

  await page.goto("/dashboard/settings");
  await page.getByRole("switch", { name: "Ministry newsletter" }).click();
  await page.getByLabel("Time zone").selectOption("Africa/Lagos");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Your preferences have been saved.")).toBeVisible();

  const { data } = await service
    .from("account_preferences")
    .select("newsletter_opt_in, timezone, profiles!inner(username)")
    .eq("profiles.username", `mary-${runId}`)
    .single();
  expect(data).toMatchObject({ newsletter_opt_in: true, timezone: "Africa/Lagos" });
});

test("signing out protects member areas, and members cannot see administration", async ({
  page,
}) => {
  await signIn(page, member.email, member.password);
  await signOutFromDashboard(page);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);

  await signIn(page, member.email, member.password, "/admin");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("a super administrator grants roles through the admin dialog", async ({ page }) => {
  const { data: users } = await service.auth.admin.listUsers({ perPage: 1000 });
  const memberId = users.users.find((user) => user.email === member.email)?.id;
  expect(memberId).toBeTruthy();

  // Bootstrap: the first super administrator is granted out-of-band (see README).
  const { error: promoteError } = await service
    .from("user_roles")
    .insert({ user_id: memberId!, role: "super_administrator" });
  expect(promoteError).toBeNull();

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: other.email,
    password: other.password,
    email_confirm: true,
    user_metadata: { display_name: other.name },
  });
  expect(createError).toBeNull();

  await signIn(page, member.email, member.password, "/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Members/ })).toBeVisible();

  await page.goto(`/admin/users?q=${encodeURIComponent(other.name)}`);
  const row = page.getByRole("row", { name: new RegExp(other.name) });
  await row.getByRole("button", { name: "Manage" }).click();

  const dialog = page.getByRole("dialog", { name: `Manage ${other.name}` });
  await dialog
    .getByRole("listitem")
    .filter({ hasText: "Contributor" })
    .getByRole("button", { name: "Grant" })
    .click();
  await expect(dialog.getByText("Contributor role granted.")).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).first().click();
  await expect(row.getByText("Contributor", { exact: true })).toBeVisible();

  const { data: roles } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", created.user!.id);
  expect(roles).toEqual([{ role: "contributor" }]);

  const { data: audit } = await service
    .from("audit_logs")
    .select("action, actor_id, metadata")
    .eq("entity_id", created.user!.id)
    .eq("action", "role.granted");
  expect(audit).toEqual([
    { action: "role.granted", actor_id: memberId, metadata: { role: "contributor" } },
  ]);
});

test("resets a forgotten password with the emailed link", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(member.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/we have sent a link to reset your password/)).toBeVisible();

  await page.goto(await confirmationPath(member.email, "Reset your ChristianTooling password"));
  await expect(page).toHaveURL("/reset-password");
  await page.getByLabel("New password", { exact: true }).fill(member.newPassword);
  await page.getByLabel("Confirm new password").fill(member.newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Your password has been updated.")).toBeVisible();

  await signOutFromDashboard(page);
  await signIn(page, member.email, member.password, undefined, false);
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await signIn(page, member.email, member.newPassword);
  await expect(page).toHaveURL("/dashboard");
});
