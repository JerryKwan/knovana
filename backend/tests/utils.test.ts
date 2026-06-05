import { describe, it, expect } from "vitest";
import { generateSlug } from "../src/utils/slug";
import { getISOStringWithOffset } from "../src/utils/datetime";
import { BadRequestError } from "../src/utils/errors";

describe("Utils Tests", () => {
  it("generateSlug cleans titles correctly and supports multilingual chars", () => {
    expect(generateSlug("React Server Components 详解")).toBe(
      "react-server-components-详解",
    );
    expect(generateSlug("  Hello World!!!  ")).toBe("hello-world");
    expect(generateSlug("Obsidian - note/with/slashes")).toBe(
      "obsidian-notewithslashes",
    );
  });

  it("getISOStringWithOffset formats ISO date containing timezone offset", () => {
    const iso = getISOStringWithOffset();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });

  it("custom errors assign code and status properly", () => {
    const err = new BadRequestError("Invalid query");
    expect(err.status).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Invalid query");
  });
});
