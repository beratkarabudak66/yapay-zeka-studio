import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import { transcribeAudio } from "../_core/voiceTranscription";
import { storagePut } from "../storage";
import { createOutput, createUpload, createFeedback, getAllFeedbacks, deleteFeedback, getOutputsByUser } from "../db";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { z } from "zod";

// Helper function to check if result is an error
function isTranscriptionError(result: any): result is { error: string; code: string; details?: string } {
  return result && typeof result === "object" && "error" in result && "code" in result;
}

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
      try {
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
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Presentation improvement failed",
          cause: error,
        });
      }
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
        audioUrl: z.string().min(1),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const rawResult = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language ?? "tr",
          prompt: "Transcribe this audio accurately",
        });

        if (isTranscriptionError(rawResult)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: rawResult.error, cause: rawResult });
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
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Voice transcription failed",
          cause: error,
        });
      }
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
        videoUrl: z.string().min(1),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Transcribe audio from video
        const rawTranscription = await transcribeAudio({
          audioUrl: input.videoUrl,
          language: "tr",
          prompt: "Transcribe video content",
        });

        if (isTranscriptionError(rawTranscription)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: rawTranscription.error, cause: rawTranscription });
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
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Video analysis failed",
          cause: error,
        });
      }
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
      try {
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
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Code generation failed",
          cause: error,
        });
      }
    }),
});

// ── File Upload ────────────────────────────────────────────────────────────

export const uploadRouter = router({
  uploadFile: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        toolType: z.enum(["presentation", "logo", "voice", "video", "coding", "video-test"]),
        base64: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64, "base64");
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
  getUploadUrl: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        toolType: z.enum(["presentation", "logo", "voice", "video", "coding", "video-test"]),
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

  getUserOutputs: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    try {
      const outputs = await getOutputsByUser(ctx.user.id);
      return outputs;
    } catch (error) {
      console.error("[Upload] Error fetching user outputs:", error);
      return [];
    }
  }),
});

// ── Video Test Tool ───────────────────────────────────────────────────────

export const videoTestRouter = router({
  analyze: publicProcedure
    .input(
      z.object({
        videoUrl: z.string(),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Önce videoyu transkribe et
        let transcription = "";
        try {
          const transcriptionResult = await transcribeAudio({
            audioUrl: input.videoUrl,
            language: "tr",
            prompt: "Transcribe this video content",
          });
          
          if (!isTranscriptionError(transcriptionResult)) {
            transcription = transcriptionResult.text || "";
          }
        } catch (transcribeError) {
          console.warn("[Video Test] Transcription failed, continuing with analysis", transcribeError);
        }

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Sen bir video analiz uzmanısın. Video transkripsiyon ve içeriğine dayalı olarak videonun yapay zeka tarafından oluşturulmuş mu yoksa gerçek insan videosu mu olduğunu belirle.

Analiz kriterleri:
1. Ses kalitesi ve doğallığı
2. Konuşma akışı ve tutarlılığı
3. Arka plan sesleri (doğal mı yapay mı)
4. Transkripsiyon metni doğallığı
5. Duraklamalar ve ritim
6. Vurgu ve tonlama
7. Tekrarlar ve disfluencies (doğal konuşma göstergesi)
8. Genel prodüksiyon kalitesi

Çıktıyı şu JSON formatında ver:
{
  "isAI": true/false,
  "confidence": 0-100,
  "type": "AI Generated" | "Real Human" | "Uncertain",
  "analysis": {
    "faceMovement": "Ses ve konuşma kalitesi",
    "eyeContact": "Konuşma doğallığı",
    "lipSync": "Ses-metin senkronizasyonu",
    "background": "Arka plan sesleri",
    "lighting": "Üretim kalitesi",
    "skinTexture": "Ses tekstürü",
    "hairMovement": "Transkripsiyon tutarlılığı",
    "animation": "Genel yapay zeka göstergeleri"
  },
  "indicators": ["gösterge 1", "gösterge 2"],
  "summary": "Kısa özet"
}`,
            },
            {
              role: "user",
              content: `Bu video transkripsiyon ve içeriğine dayalı olarak analiz et ve yapay zeka mı yoksa gerçek insan videosu mu olduğunu belirle:

Transkripsiyon: ${transcription || "Transkripsiyon alınamadı"}

Video URL: ${input.videoUrl}`,
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
                  isAI: { type: "boolean" },
                  confidence: { type: "number", minimum: 0, maximum: 100 },
                  type: { type: "string", enum: ["AI Generated", "Real Human", "Uncertain"] },
                  analysis: {
                    type: "object",
                    properties: {
                      faceMovement: { type: "string" },
                      eyeContact: { type: "string" },
                      lipSync: { type: "string" },
                      background: { type: "string" },
                      lighting: { type: "string" },
                      skinTexture: { type: "string" },
                      hairMovement: { type: "string" },
                      animation: { type: "string" },
                    },
                    required: ["faceMovement", "eyeContact", "lipSync", "background", "lighting", "skinTexture", "hairMovement", "animation"],
                    additionalProperties: false,
                  },
                  indicators: { type: "array", items: { type: "string" } },
                  summary: { type: "string" },
                },
                required: ["isAI", "confidence", "type", "analysis", "indicators", "summary"],
                additionalProperties: false,
              },
            },
          },
        });

        let analysisResult;
        try {
          const content = response.choices?.[0]?.message?.content;
          if (typeof content === "string") {
            analysisResult = JSON.parse(content);
          } else {
            analysisResult = content;
          }
        } catch (parseError) {
          analysisResult = {
            isAI: null,
            confidence: 0,
            type: "Uncertain",
            analysis: {
              faceMovement: "Analiz yapılamadı",
              eyeContact: "Analiz yapılamadı",
              lipSync: "Analiz yapılamadı",
              background: "Analiz yapılamadı",
              lighting: "Analiz yapılamadı",
              skinTexture: "Analiz yapılamadı",
              hairMovement: "Analiz yapılamadı",
              animation: "Analiz yapılamadı",
            },
            indicators: [],
            summary: "Video analiz edilemedi. Lütfen başka bir video deneyin.",
          };
        }

        if (ctx.user) {
          await createOutput({
            userId: ctx.user.id,
            outputKey: `video-test-${Date.now()}`,
            outputUrl: "",
            toolType: "video-test",
            metadata: JSON.stringify(analysisResult),
          });
        }

        return analysisResult;
      } catch (error) {
        console.error("[Video Test] Error:", error);
        return {
          isAI: null,
          confidence: 0,
          type: "Uncertain",
          analysis: {
            faceMovement: "Hata",
            eyeContact: "Hata",
            lipSync: "Hata",
            background: "Hata",
            lighting: "Hata",
            skinTexture: "Hata",
            hairMovement: "Hata",
            animation: "Hata",
          },
          indicators: [],
          summary: "Video analiz sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        };
      }
    }),
});


// ── Feedback Tool ─────────────────────────────────────────────────────────

export const feedbackRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Ad en az 2 karakter olmalı"),
        email: z.string().email("Geçerli bir email adresi girin"),
        subject: z.string().min(5, "Konu en az 5 karakter olmalı"),
        message: z.string().min(10, "Mesaj en az 10 karakter olmalı"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const feedbackId = await createFeedback({
          userId: ctx.user?.id,
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
        });

        return {
          success: true,
          id: feedbackId.id,
          message: "Geri bildiriminiz başarıyla gönderildi. Teşekkür ederiz!",
        };
      } catch (error) {
        console.error("[Feedback] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Geri bildirim gönderme sırasında bir hata oluştu",
        });
      }
    }),

  getAll: adminProcedure.query(async () => {
    try {
      const feedbacks = await getAllFeedbacks();
      return feedbacks;
    } catch (error) {
      console.error("[Feedback] Error fetching all:", error);
      return [];
    }
  }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteFeedback(input.id);
        return { success: true, message: "Geri bildirim silindi" };
      } catch (error) {
        console.error("[Feedback] Error deleting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Geri bildirim silme sırasında bir hata oluştu",
        });
      }
    }),
});
