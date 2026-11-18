function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

/**
 * Validates a user-supplied post-login destination (e.g. ?next=/dashboard).
 *
 * Only same-origin, absolute paths are allowed. Anything that could send the
 * user to another site (https://evil.example, //evil.example, /\evil.example,
 * javascript:..., encoded variants) falls back to `fallback`. This prevents
 * open-redirect phishing through auth links.
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback: string = "/dashboard",
): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 2048) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }

  // Must be a single-slash absolute path; reject protocol-relative and backslash tricks.
  for (const candidate of [next, decoded]) {
    if (!candidate.startsWith("/")) return fallback;
    if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;
    // Browsers strip tabs and newlines from URLs ("/\t/evil" becomes "//evil").
    if (hasControlCharacters(candidate)) return fallback;
  }

  // Resolve against a dummy origin and confirm it stays same-origin.
  try {
    const url = new URL(next, "https://placeholder.invalid");
    if (url.origin !== "https://placeholder.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
