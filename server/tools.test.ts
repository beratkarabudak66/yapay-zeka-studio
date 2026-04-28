import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Hoisted mocks ─────────────────────────────────────────────────────────

const mockInvokeLLM = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            title: "Test Sunumu",
            slides: [
              {
                slideNumber: 1,
                heading: "Giriş",
                bullets: ["Madde 1", "Madde 2"],
                notes: "Konuşmacı notu",
              },
            ],
            summary: "Bu bir test sunumudur.",
          }),
        },
      },
    ],
  })
);

vi.mock("./_core/llm", () => ({ invokeLLM: mockInvokeLLM }));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/test-image.png" }),
}));

vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    text: "Test transkripsiyon metni",
    segments: [{ start: 0, end: 2, text: "Test" }],
    language: "tr",
    duration: 2,
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

vi.mock("./db", () => ({
  createUpload: vi.fn().mockResolvedValue({ id: 1 }),
  createOutput: vi.fn().mockResolvedValue({ id: 1 }),
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUploadsByUser: vi.fn().mockResolvedValue([]),
  getOutputsByUser: vi.fn().mockResolvedValue([]),
}));

// ── Context helper ────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("presentation.improve", () => {
  it("returns structured presentation from text input", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.presentation.improve({ text: "Yapay zeka hakkında bir sunum" });

    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("slides");
    expect(result).toHaveProperty("summary");
    expect(Array.isArray(result.slides)).toBe(true);
    expect(result.slides.length).toBeGreaterThan(0);
    expect(result.slides[0]).toHaveProperty("heading");
    expect(result.slides[0]).toHaveProperty("bullets");
  });

  it("throws error on empty text", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.presentation.improve({ text: "" })).rejects.toThrow();
  });
});

describe("presentation.generateImage", () => {
  it("returns image URL for valid prompt", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.presentation.generateImage({ prompt: "Eğitim temalı görsel" });

    expect(result).toHaveProperty("url");
    expect(typeof result.url).toBe("string");
  });
});

describe("logo.generate", () => {
  it("returns logo URL for valid brand name", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.logo.generate({ brandName: "TechAkademi", style: "modern" });

    expect(result).toHaveProperty("url");
    expect(typeof result.url).toBe("string");
  });

  it("throws error on empty brand name", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.logo.generate({ brandName: "", style: "modern" })).rejects.toThrow();
  });
});

describe("coding.generate", () => {
  it("generates JavaScript code", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              code: "console.log('Hello World');",
              explanation: "Bu kod konsola Hello World yazar.",
              improvements: ["Değişken kullanabilirsiniz"],
              errors: [],
            }),
          },
        },
      ],
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.coding.generate({
      prompt: "Merhaba dünya yaz",
      language: "javascript",
      mode: "generate",
    });

    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("explanation");
    expect(result).toHaveProperty("improvements");
    expect(result).toHaveProperty("errors");
    expect(Array.isArray(result.improvements)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("throws error on empty prompt", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.coding.generate({ prompt: "", language: "python", mode: "generate" })
    ).rejects.toThrow();
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string) => clearedCookies.push(name),
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
  });
});
