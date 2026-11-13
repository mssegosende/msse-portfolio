import { describe, expect, it } from "vitest";
import { LINKEDIN_PROFILE } from "./contactLimits";

// The same cases as the backend's (backend/tests/test_contact_review.py).
const GOOD = [
  "linkedin.com/in/ada",
  "https://www.linkedin.com/in/ada-lovelace/",
  "http://linkedin.com/in/ada_l",
  "https://ar.linkedin.com/in/ada-lovelace-1815",
  "WWW.LINKEDIN.COM/IN/ADA",
];
const BAD = [
  "ada",
  "https://linkedin.com/company/acme",
  "https://www.linkedin.com/in/",
  "https://evil.example/linkedin.com/in/ada",
  "https://linkedin.com.evil.example/in/ada",
  "linkedin.com/in/ada?x=<script>",
  "javascript:alert(1)//linkedin.com/in/ada",
];

describe("LINKEDIN_PROFILE", () => {
  it.each(GOOD)("accepts %s", (url) => expect(LINKEDIN_PROFILE.test(url)).toBe(true));
  it.each(BAD)("rejects %s", (url) => expect(LINKEDIN_PROFILE.test(url)).toBe(false));
});
