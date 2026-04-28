import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import { transcribeAudio } from "../_core/voiceTranscription";
import { storagePut } from "../storage";
import { createOutput, createUpload } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

// ── Presentation Tool ──────────────────────────────────────────────────────

export const presentationRouter = router({
  improve: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Sen bir sunum tasarım uzmanısın. Kullanıcının verdiği metni profesyonel bir sunum yapısına dönüştür.
Çıktıyı şu JSON formatında ver:
{
  "title": "Sunum başlığı",
  "slides": [
    {
      "slideNumber": 1,
      "heading": "Slayt başlığı",
      "bullets": ["Madde 1", "Madde 2"],
      "notes": "Konuşmacı notu"
    }
  ],
  "summary": "Kısa özet"
}`,
          },
          {
            role: "user",
            content: `Şu metni profesyonel bir sunuma dönüştür:\n\n${input.text}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "presentation_output",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      slideNumber: { type: "integer" },
                      heading: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                      notes: { type: "string" },
                    },
                    required: ["slideNumber", "heading", "bullets", "notes"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
              },
              required: ["title", "slides", "summary"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

      if (ctx.user) {
        await createOutput({
          userId: ctx.user.id,
          toolType: "presentation",
          metadata: JSON.stringify(parsed),
        });
      }

      return parsed;
    }),

  generateImage: publicProcedure
    .input(z.object({ prompt: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { url } = await generateImage({
        prompt: `Professional presentation slide illustration: ${input.prompt}. Clean, modern, educational style, minimal design.`,
      });
      return { url };
    }),
});

// ── Logo Generator ─────────────────────────────────────────────────────────

export const logoRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        brandName: z.string().min(1),
        style: z.enum(["modern", "clean", "educational", "corporate"]),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const styleDescriptions = {
        modern: "modern, sleek, minimalist with bold typography",
        clean: "clean, simple, white space focused with elegant lines",
        educational: "educational, friendly, book or graduation themed",
        corporate: "corporate, professional, trustworthy, business-like",
      };

      const prompt = `Logo design for "${input.brandName}". Style: ${styleDescriptions[input.style]}. ${
        input.description ? input.description + ". " : ""
      }Vector logo, flat design, no background, professional quality, suitable for school or brand use.`;

      const { url } = await generateImage({ prompt });

      if (ctx.user) {
        await createOutput({
          userId: ctx.user.id,
          toolType: "logo",
          outputUrl: url,
          metadata: JSON.stringify({ brandName: input.brandName, style: input.style }),
        });
      }

      return { url };
    }),
});

// ── Voice Tool ─────────────────────────────────────────────────────────────

export const voiceRouter = router({
  transcribe: publicProcedure
    .input(
      z.object({
        audioUrl: z.string().url(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const rawResult = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: input.language ?? "tr",
        prompt: "Transcribe this audio accurately",
      });

      if ("error" in rawResult) {
        throw new TRPCError({ code: "BAD_REQUEST", message: rawResult.error });
      }
      const result = rawResult;

      const analysisResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Ses transkripsiyon analisti olarak şu metni analiz et ve JSON formatında döndür:\n{\n  "summary": "Kısa özet",\n  "keyPoints": ["Anahtar nokta 1", "Anahtar nokta 2"],\n  "tone": "Ses tonu (resmi/gayri resmi/akademik vb.)",\n  "wordCount": 0,\n  "language": "Dil"\n}`,
          },
          {
            role: "user",
            content: `Şu transkripsiyonu analiz et:\n\n${result.text}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "voice_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                keyPoints: { type: "array", items: { type: "string" } },
                tone: { type: "string" },
                wordCount: { type: "integer" },
                language: { type: "string" },
              },
              required: ["summary", "keyPoints", "tone", "wordCount", "language"],
              additionalProperties: false,
            },
          },
        },
      });

      const analysisContent = analysisResponse.choices[0]?.message?.content;
      const analysis = JSON.parse(
        typeof analysisContent === "string" ? analysisContent : JSON.stringify(analysisContent)
      );

      if (ctx.user) {
        await createOutput({
          userId: ctx.user.id,
          toolType: "voice",
          metadata: JSON.stringify({ transcription: result.text, analysis }),
        });
      }

      return {
        transcription: result.text,
        segments: result.segments ?? [],
        analysis,
      };
    }),

  analyzeOptions: publicProcedure
    .input(z.object({ transcription: z.string().min(1), toneOption: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Ses işleme uzmanısın. Kullanıcının seçtiği ses tonu seçeneğine göre öneriler sun.`,
          },
          {
            role: "user",
            content: `Transkripsiyon: "${input.transcription}"\nSeçilen ton: ${input.toneOption}\n\nBu ses için ${input.toneOption} tonunda işleme önerileri ver.`,
          },
        ],
      });
      return { suggestions: response.choices[0]?.message?.content ?? "" };
    }),
});

// ── Video Tool ─────────────────────────────────────────────────────────────

export const videoRouter = router({
  analyze: publicProcedure
    .input(
      z.object({
        videoUrl: z.string().url(),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Transcribe audio from video
      const rawTranscription = await transcribeAudio({
        audioUrl: input.videoUrl,
        language: "tr",
        prompt: "Transcribe video content",
      });

      if ("error" in rawTranscription) {
        throw new TRPCError({ code: "BAD_REQUEST", message: rawTranscription.error });
      }
      const transcription = rawTranscription;

      const analysisResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Video içerik analisti olarak şu transkripsiyonu analiz et ve JSON formatında döndür:\n{\n  "summary": "Video özeti",\n  "topics": ["Konu 1", "Konu 2"],\n  "suggestedEnhancements": ["Parlaklık artırma önerilir", "Stabilizasyon gerekli"],\n  "subtitleLines": [{"time": "00:00:01", "text": "Altyazı metni"}],\n  "contentType": "İçerik türü (eğitim/sunum/vlog vb.)"\n}`,
          },
          {
            role: "user",
            content: `Video transkripsiyonu:\n\n${transcription.text}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "video_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                topics: { type: "array", items: { type: "string" } },
                suggestedEnhancements: { type: "array", items: { type: "string" } },
                subtitleLines: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "string" },
                      text: { type: "string" },
                    },
                    required: ["time", "text"],
                    additionalProperties: false,
                  },
                },
                contentType: { type: "string" },
              },
              required: ["summary", "topics", "suggestedEnhancements", "subtitleLines", "contentType"],
              additionalProperties: false,
            },
          },
        },
      });

      const analysisContent = analysisResponse.choices[0]?.message?.content;
      const analysis = JSON.parse(
        typeof analysisContent === "string" ? analysisContent : JSON.stringify(analysisContent)
      );

      if (ctx.user) {
        await createOutput({
          userId: ctx.user.id,
          toolType: "video",
          metadata: JSON.stringify({ transcription: transcription.text, analysis }),
        });
      }

      return {
        transcription: transcription.text,
        analysis,
      };
    }),
});

// ── Coding Assistant ───────────────────────────────────────────────────────

export const codingRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        language: z.enum(["html", "css", "javascript", "python"]),
        mode: z.enum(["generate", "explain", "fix"]),
        existingCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const modeInstructions = {
        generate: `${input.language.toUpperCase()} kodu üret. Sadece kod ver, açıklama sonraya bırak.`,
        explain: `Verilen ${input.language.toUpperCase()} kodunu sade Türkçe ile açıkla.`,
        fix: `Verilen ${input.language.toUpperCase()} kodundaki hataları bul ve düzelt. Düzeltilmiş kodu ver.`,
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Sen deneyimli bir yazılım geliştiricisin. ${modeInstructions[input.mode]}
Yanıtını şu JSON formatında ver:
{
  "code": "Üretilen/düzeltilen kod",
  "explanation": "Sade Türkçe açıklama",
  "improvements": ["İyileştirme önerisi 1", "İyileştirme önerisi 2"],
  "errors": ["Tespit edilen hata 1"]
}`,
          },
          {
            role: "user",
            content:
              input.mode === "generate"
                ? `${input.language.toUpperCase()} ile şunu yap: ${input.prompt}`
                : `${input.existingCode ? `Kod:\n\`\`\`${input.language}\n${input.existingCode}\n\`\`\`\n\n` : ""}${input.prompt}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "coding_output",
            strict: true,
            schema: {
              type: "object",
              properties: {
                code: { type: "string" },
                explanation: { type: "string" },
                improvements: { type: "array", items: { type: "string" } },
                errors: { type: "array", items: { type: "string" } },
              },
              required: ["code", "explanation", "improvements", "errors"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

      if (ctx.user) {
        await createOutput({
          userId: ctx.user.id,
          toolType: "coding",
          metadata: JSON.stringify({ language: input.language, mode: input.mode, prompt: input.prompt }),
        });
      }

      return parsed;
    }),
});

// ── File Upload ────────────────────────────────────────────────────────────

export const uploadRouter = router({
  getUploadUrl: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        toolType: z.enum(["presentation", "logo", "voice", "video", "coding"]),
        fileBase64: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `uploads/${input.toolType}/${Date.now()}-${input.fileName}`;
      const { key, url } = await storagePut(fileKey, buffer, input.fileType);

      if (ctx.user) {
        await createUpload({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey: key,
          fileUrl: url,
          fileType: input.fileType,
          toolType: input.toolType,
        });
      }

      return { key, url };
    }),
});
