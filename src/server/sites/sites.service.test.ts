import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionClaims } from "@/server/access/access.rules";

// Mock the repository so the service is tested WITHOUT a database (and without
// loading the Prisma client at all).
vi.mock("./sites.repository", () => ({
  sitesRepository: {
    slugExists: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

import { sitesRepository } from "./sites.repository";
import { createSite } from "./sites.service";

type CreatedSite = Awaited<ReturnType<typeof sitesRepository.create>>;

const workspaceUser: SessionClaims = {
  userId: "u1",
  platformRole: "user",
  workspace: { id: "ws_1", role: "member" },
  workspaces: [{ id: "ws_1", role: "member" }],
  siteAccess: [],
};

const input = {
  businessName: "Abu Ali",
  slug: "abu-ali",
  verticalKey: "barbershop",
  language: "ar" as const,
  content: {},
};

beforeEach(() => vi.clearAllMocks());

// Breaking scenarios only.
describe("createSite", () => {
  it("forbids a caller with no workspace (site editors/viewers cannot create)", async () => {
    const noWorkspace: SessionClaims = {
      userId: "u2",
      platformRole: "user",
      workspaces: [],
      siteAccess: [{ siteId: "s9", level: "editor", builderAccess: false }],
    };
    await expect(createSite(noWorkspace, input)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(sitesRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a taken slug with CONFLICT and does not create", async () => {
    vi.mocked(sitesRepository.slugExists).mockResolvedValue(true);
    await expect(createSite(workspaceUser, input)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(sitesRepository.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid slug with VALIDATION_ERROR (defense in depth)", async () => {
    vi.mocked(sitesRepository.slugExists).mockResolvedValue(false);
    await expect(
      createSite(workspaceUser, { ...input, slug: "AB" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("attaches the site to the workspace from CLAIMS, not client input (tenancy)", async () => {
    vi.mocked(sitesRepository.slugExists).mockResolvedValue(false);
    vi.mocked(sitesRepository.create).mockResolvedValue({
      id: "site_1",
      slug: "abu-ali",
      status: "draft",
    } as unknown as CreatedSite);

    await createSite(workspaceUser, input);

    expect(sitesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "ws_1", slug: "abu-ali" }),
    );
  });
});
