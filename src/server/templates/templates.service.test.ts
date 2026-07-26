import { describe, expect, it, vi } from "vitest";

// A synthetic catalog so the tests don't depend on the shipped templates. The
// factory is self-contained (vi.mock is hoisted — no outside references).
vi.mock("@/templates/registry", () => {
  const mod = (
    key: string,
    tags: string[],
    over: Record<string, unknown> = {},
  ) => ({
    key,
    label: `قالب ${key}`,
    vertical: "misc",
    description: `وصف ${key}`,
    tags,
    Component: () => null,
    defaults: {},
    steps: [],
    tokens: [],
    ...over,
  });
  return {
    TEMPLATES: [
      mod("a", ["حلاقة", "حجز", "رجالي"], { label: "صالون ألف", description: "حلاقة راقية" }),
      mod("b", ["حلاقة", "مطعم"], { label: "بيت باء", description: "أكل شعبي" }),
      mod("c", ["حجز", "عيادة"]),
      mod("d", ["حلاقة", "حجز"], { cover: "https://cdn/x.jpg" }),
    ],
  };
});

import { listTemplates, listTags } from "./templates.service";
import { ListTemplatesQuery, ListTagsQuery } from "./templates.schema";

const q = (o: Partial<Record<string, unknown>> = {}) =>
  ListTemplatesQuery.parse({ tags: undefined, ...o });
const tq = (o: Partial<Record<string, unknown>> = {}) => ListTagsQuery.parse(o);

describe("listTemplates", () => {
  it("returns every template with no query/tags", () => {
    const page = listTemplates(q());
    expect(page.total).toBe(4);
    expect(page.items.map((i) => i.key)).toEqual(["a", "b", "c", "d"]);
    expect(page.nextCursor).toBeNull();
  });

  it("AND-filters tags: a template must carry ALL selected tags", () => {
    const page = listTemplates(q({ tags: "حلاقة,حجز" }));
    // a and d carry both; b lacks حجز, c lacks حلاقة.
    expect(page.items.map((i) => i.key)).toEqual(["a", "d"]);
    expect(page.total).toBe(2);
  });

  it("searches name + description + tags, Arabic-normalized", () => {
    // 'اكل' should match 'أكل' in b's description despite the hamza.
    expect(listTemplates(q({ query: "اكل" })).items.map((i) => i.key)).toEqual(["b"]);
    // tag search
    expect(listTemplates(q({ query: "عيادة" })).items.map((i) => i.key)).toEqual(["c"]);
  });

  it("paginates by cursor and stops at the end", () => {
    const p1 = listTemplates(q({ limit: 2 }));
    expect(p1.items.map((i) => i.key)).toEqual(["a", "b"]);
    expect(p1.nextCursor).toBe("b");

    const p2 = listTemplates(q({ limit: 2, cursor: p1.nextCursor! }));
    expect(p2.items.map((i) => i.key)).toEqual(["c", "d"]);
    expect(p2.nextCursor).toBeNull();
  });

  it("restarts from the top when the cursor is not in the result set", () => {
    const page = listTemplates(q({ cursor: "does-not-exist" }));
    expect(page.items[0]?.key).toBe("a");
  });

  it("exposes coverUrl (null when the template has no cover)", () => {
    const page = listTemplates(q());
    expect(page.items.find((i) => i.key === "a")?.coverUrl).toBeNull();
    expect(page.items.find((i) => i.key === "d")?.coverUrl).toBe("https://cdn/x.jpg");
    expect(page.items[0]?.previewUrl).toBe("/templates/a");
  });
});

describe("listTags", () => {
  it("ranks tags by popularity, then label, capped by limit", () => {
    const tags = listTags(tq({ limit: 10 }));
    // حلاقة×3, حجز×3, then singles al+phabetical by Arabic collation.
    expect(tags.slice(0, 2).map((t) => t.label).sort()).toEqual(["حجز", "حلاقة"]);
    expect(tags.find((t) => t.label === "حلاقة")?.count).toBe(3);
    expect(tags.find((t) => t.label === "حجز")?.count).toBe(3);
  });

  it("honors the limit (suggest first N)", () => {
    expect(listTags(tq({ limit: 2 }))).toHaveLength(2);
  });

  it("filters tag labels by query for the all-tags panel", () => {
    const tags = listTags(tq({ query: "مطعم" }));
    expect(tags.map((t) => t.label)).toEqual(["مطعم"]);
  });
});
