import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeSubmissionPhone } from "./submissions.rules";

// Redis is faked; `incrVal` controls the rate-limit counter per test.
const h = vi.hoisted(() => ({ incrVal: 1 }));
vi.mock("@/lib/redis", () => ({
  getRedis: () => ({ incr: async () => h.incrVal, expire: async () => 1 }),
}));

vi.mock("./submissions.repository", () => ({
  PAGE_SIZE: 50,
  submissionsRepository: {
    siteExists: vi.fn(),
    findDuplicate: vi.fn(),
    create: vi.fn(),
    refresh: vi.fn(),
  },
}));

import { submissionsRepository as repo } from "./submissions.repository";
import { createSubmission } from "./submissions.service";

const base = {
  kind: "PROVIDER" as const,
  name: "أحمد",
  phone: "0912345678",
  category: "برمجة",
  area: "دمشق",
  details: "",
};

async function code(fn: () => Promise<unknown>): Promise<string | undefined> {
  try {
    await fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return undefined;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.incrVal = 1;
  vi.mocked(repo.siteExists).mockResolvedValue(true);
  vi.mocked(repo.findDuplicate).mockResolvedValue(null as never);
  vi.mocked(repo.create).mockResolvedValue({ id: "s1" } as never);
  vi.mocked(repo.refresh).mockResolvedValue({ id: "s1" } as never);
});

describe("normalizeSubmissionPhone", () => {
  it("normalizes every accepted Syrian mobile form to +9639…", () => {
    for (const raw of ["0912345678", "963912345678", "+963912345678", "+963 912 345 678", "0912-345-678"]) {
      expect(normalizeSubmissionPhone(raw)).toBe("+963912345678");
    }
  });
  it("rejects non-Syrian-mobile input", () => {
    for (const raw of ["12345", "0812345678", "091234567", "abc", ""]) {
      expect(normalizeSubmissionPhone(raw)).toBeNull();
    }
  });
});

describe("createSubmission", () => {
  it("silently discards honeypot hits (same success shape, nothing stored)", async () => {
    const r = await createSubmission("site1", { ...base, company: "bot" }, "ip");
    expect(r.ok).toBe(true);
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.siteExists).not.toHaveBeenCalled();
  });

  it("404s an unknown site", async () => {
    vi.mocked(repo.siteExists).mockResolvedValue(false);
    expect(await code(() => createSubmission("nope", base, "ip"))).toBe("NOT_FOUND");
  });

  it("rejects an invalid phone with a field error", async () => {
    expect(await code(() => createSubmission("site1", { ...base, phone: "123" }, "ip"))).toBe("VALIDATION_ERROR");
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("stores a new submission with the normalized phone + raw phone", async () => {
    await createSubmission("site1", base, "ip");
    expect(repo.create).toHaveBeenCalledWith("site1", expect.objectContaining({ phone: "+963912345678", phoneRaw: "0912345678" }));
    expect(repo.refresh).not.toHaveBeenCalled();
  });

  it("passes uploaded image URLs through to storage", async () => {
    await createSubmission("site1", { ...base, images: ["https://cdn.example/a.jpg", "https://cdn.example/b.webp"] }, "ip");
    expect(repo.create).toHaveBeenCalledWith(
      "site1",
      expect.objectContaining({ images: ["https://cdn.example/a.jpg", "https://cdn.example/b.webp"] }),
    );
  });

  it("defaults images to an empty array when none are attached", async () => {
    await createSubmission("site1", base, "ip");
    expect(repo.create).toHaveBeenCalledWith("site1", expect.objectContaining({ images: [] }));
  });

  it("refreshes the existing row on a duplicate (site+kind+phone), never inserts twice", async () => {
    vi.mocked(repo.findDuplicate).mockResolvedValue({ id: "dup1" } as never);
    await createSubmission("site1", base, "ip");
    expect(repo.refresh).toHaveBeenCalledWith("dup1", expect.objectContaining({ phone: "+963912345678" }));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("rate-limits after the hourly cap (Redis counter over 5 → 429)", async () => {
    h.incrVal = 6;
    expect(await code(() => createSubmission("site1", base, "ip"))).toBe("RATE_LIMITED");
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("does not rate-limit when the caller has no IP", async () => {
    h.incrVal = 99;
    const r = await createSubmission("site1", base, null);
    expect(r.ok).toBe(true);
  });
});
