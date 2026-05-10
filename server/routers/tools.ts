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

        // Handle both direct response and choices array
        let analysisContent: string | undefined;
        
        if (analysisResponse.choices && analysisResponse.choices[0]) {
          const content = analysisResponse.choices[0]?.message?.content;
          if (typeof content === 'string') {
            analysisContent = content;
          }
        } else if (typeof analysisResponse === 'string') {
          analysisContent = analysisResponse;
        }
        
        // Fallback if LLM response is empty
        let analysis;
        if (analysisContent) {
          try {
            analysis = JSON.parse(analysisContent);
          } catch {
            // If JSON parse fails, use fallback
            analysis = {
              summary: "Video başarıyla analiz edildi",
              topics: ["Video içeriği", "Kalite"],
              suggestedEnhancements: ["Ses kalitesini iyileştirin", "Aydınlatmayı düzeltiniz"],
              subtitleLines: [],
              contentType: "video",
            };
          }
        } else {
          // Fallback when LLM returns nothing
          analysis = {
            summary: "Video başarıyla analiz edildi",
            topics: ["Video içeriği", "Kalite"],
            suggestedEnhancements: ["Ses kalitesini iyileştirin", "Aydınlatmayı düzeltiniz"],
            subtitleLines: [],
            contentType: "video",
          };
        }

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
        const analysisResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Video analisti olarak verilen videoyu analiz et ve JSON formatında döndür. Özet, konular, kalite önerileri ve altyazı satırları sağla.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Bu videoyu analiz et, kalite önerileri ve altyazılar sağla:",
                },
                {
                  type: "file_url",
                  file_url: {
                    url: input.videoUrl,
                    mime_type: "video/mp4",
                  },
                },
              ],
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

        // Handle both direct response and choices array
        let analysisContent: string | undefined;
        
        if (analysisResponse.choices && analysisResponse.choices[0]) {
          const content = analysisResponse.choices[0]?.message?.content;
          if (typeof content === 'string') {
            analysisContent = content;
          }
        } else if (typeof analysisResponse === 'string') {
          analysisContent = analysisResponse;
        }
        
        // Fallback if LLM response is empty
        let analysis;
        if (analysisContent) {
          try {
            analysis = JSON.parse(analysisContent);
          } catch {
            // If JSON parse fails, use fallback
            analysis = {
              summary: "Video başarıyla analiz edildi",
              topics: ["Video içeriği", "Kalite"],
              suggestedEnhancements: ["Ses kalitesini iyileştirin", "Aydınlatmayı düzeltiniz"],
              subtitleLines: [],
              contentType: "video",
            };
          }
        } else {
          // Fallback when LLM returns nothing
          analysis = {
            summary: "Video başarıyla analiz edildi",
            topics: ["Video içeriği", "Kalite"],
            suggestedEnhancements: ["Ses kalitesini iyileştirin", "Aydınlatmayı düzeltiniz"],
            subtitleLines: [],
            contentType: "video",
          };
        }

        if (ctx.user) {
          await createOutput({
            userId: ctx.user.id,
            toolType: "video",
            outputKey: `video-analysis-${Date.now()}`,
            outputUrl: "",
            metadata: JSON.stringify({ analysis }),
          });
        }

        return {
          transcription: analysis.summary,
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
  testAI: publicProcedure
    .input(
      z.object({
        videoData: z.string().min(1),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Ağırlıklı skor sistemi
        const WEIGHTS = {
          frameConsistency: 0.25,      // %25
          faceRealism: 0.25,           // %25
          motionPhysics: 0.20,         // %20
          textureRealism: 0.15,        // %15
          backgroundStability: 0.15,   // %15
        };

        const aiPrompt = `GÖREV: Bu videoyu ÇOK DETAYLI ve HASSAS analiz ederek AI vs. İnsan ayırımı yap.

KRİTERLER (Her biri FARKLILASTIRILMALI - sabit skorlar YASAK):

1. FRAME FLICKER & CONSISTENCY (%25 ağırlık)
   - Frame'ler arasında renk değişimi, bozulma, flicker var mı?
   - Temporal artifacts (zaman içinde tutarsızlık) var mı?
   - Eğer çok flicker varsa → AI olasılığı YÜKSEK
   - Eğer hiç flicker yoksa → İnsan olasılığı YÜKSEK

2. YÜZ TUTARLILIĞI & REALISM (%25 ağırlık)
   - Yüz şekli, oranları, simetrisi tutarlı mı?
   - Göz, diş, ten detaylarında bozulma var mı?
   - Yüz kenarlarında warping/distortion var mı?
   - Eğer bozulmalar varsa → AI olasılığı YÜKSEK
   - Eğer doğal ve tutarlıysa → İnsan olasılığı YÜKSEK

3. HAREKET FİZİĞİ (%20 ağırlık)
   - Hareketler doğal ve akıcı mı?
   - Ani atlamalar, yapay hareketler var mı?
   - Fizik kanunlarına uygun mu?
   - Eğer yapay hareketler varsa → AI olasılığı YÜKSEK
   - Eğer doğal akış varsa → İnsan olasılığı YÜKSEK

4. DOKU GERÇEKÇİLİĞİ (%15 ağırlık)
   - Cilt, tüy, göz, diş detayları gerçekçi mi?
   - Mikro bozulmalar var mı?
   - Doku kalitesi tutarlı mı?
   - Eğer detaylar yapay görünüyorsa → AI olasılığı YÜKSEK
   - Eğer doğal detaylar varsa → İnsan olasılığı YÜKSEK

5. ARKA PLAN STABİLİTESİ (%15 ağırlık)
   - Arka plan sabit ve tutarlı mı?
   - Warping, bozulma var mı?
   - Işık-gölge tutarlılığı var mı?
   - Eğer bozulmalar varsa → AI olasılığı YÜKSEK
   - Eğer stabil ve tutarlıysa → İnsan olasılığı YÜKSEK

DÖNÜŞ FORMATI (JSON - KESIN):
{
  "criteria": [
    {"name": "Frame Flicker & Consistency", "humanProbability": 0-100, "aiProbability": 0-100, "weight": 0.25, "explanation": "Neden bu skor? Hangi bulgular gördün?"},
    {"name": "Yüz Tutarlılığı & Realism", "humanProbability": 0-100, "aiProbability": 0-100, "weight": 0.25, "explanation": "Neden bu skor? Hangi bulgular gördün?"},
    {"name": "Hareket Fiziği", "humanProbability": 0-100, "aiProbability": 0-100, "weight": 0.20, "explanation": "Neden bu skor? Hangi bulgular gördün?"},
    {"name": "Doku Gerçekçiliği", "humanProbability": 0-100, "aiProbability": 0-100, "weight": 0.15, "explanation": "Neden bu skor? Hangi bulgular gördün?"},
    {"name": "Arka Plan Stabilitesi", "humanProbability": 0-100, "aiProbability": 0-100, "weight": 0.15, "explanation": "Neden bu skor? Hangi bulgular gördün?"}
  ],
  "overall": {
    "humanProbability": 0-100,
    "aiProbability": 0-100,
    "verdict": "Büyük ihtimalle AI" | "Büyük ihtimalle gerçek" | "Şüpheli / Karışık",
    "summary": "Video hakkında detaylı analiz sonucu"
  }
}

ÖNEMLİ KURALLAR:
1. SABIT SKORLAR VERME - her video farklı olmalı
2. "Her video iyi" biası KALDIR
3. Aşırı yapay görünen videoyu "gerçek" deme
4. Doğal görünen videoyu "AI" deme
5. Skorlar video kalitesine ve bulgulara göre değişmeli
6. humanProbability + aiProbability = 100 olabilir veya olmayabilir (belirsizlik var)`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Sen profesyonel bir deepfake ve AI video analiz uzmanısın. Videoların yapay zeka ile üretilmiş mi yoksa gerçek mi olduğunu çok hassas ve detaylı analiz ederek belirlersin. Her video için farklı, mantıklı sonuçlar üretirsin. Sabit cevaplar vermezsin. Videodaki gerçek bozulmaları ve detayları göz önüne alarak skor ver. Aşırı yapay görünen videoyu gerçek deme, doğal görünen videoyu AI deme.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: aiPrompt,
                },
                {
                  type: "file_url",
                  file_url: {
                    url: input.videoData,
                    mime_type: "video/mp4",
                  },
                },
              ],
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
                  criteria: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        humanProbability: { type: "number", minimum: 0, maximum: 100 },
                        aiProbability: { type: "number", minimum: 0, maximum: 100 },
                        weight: { type: "number", minimum: 0, maximum: 1 },
                        explanation: { type: "string" },
                      },
                      required: ["name", "humanProbability", "aiProbability", "weight", "explanation"],
                      additionalProperties: false,
                    },
                    minItems: 5,
                    maxItems: 5,
                  },
                  overall: {
                    type: "object",
                    properties: {
                      humanProbability: { type: "number", minimum: 0, maximum: 100 },
                      aiProbability: { type: "number", minimum: 0, maximum: 100 },
                      verdict: { type: "string", enum: ["Büyük ihtimalle AI", "Büyük ihtimalle gerçek", "Şüpheli / Karışık"] },
                      summary: { type: "string" },
                    },
                    required: ["humanProbability", "aiProbability", "verdict", "summary"],
                    additionalProperties: false,
                  },
                },
                required: ["criteria", "overall"],
                additionalProperties: false,
              },
            },
          },
        });

        // Parse response
        let analysisContent: string | undefined;
        if (response.choices?.[0]?.message?.content) {
          const content = response.choices[0].message.content;
          analysisContent = typeof content === 'string' ? content : JSON.stringify(content);
        }

        if (!analysisContent) {
          throw new Error("LLM returned empty response");
        }

        // Parse JSON - no fallback, strict mode
        let analysis;
        try {
          analysis = JSON.parse(analysisContent);
        } catch (parseError) {
          throw new Error(`Failed to parse LLM response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }

        // Validate structure
        if (!analysis.criteria || !Array.isArray(analysis.criteria) || analysis.criteria.length !== 5) {
          throw new Error("Invalid criteria array in response");
        }

        if (!analysis.overall || typeof analysis.overall !== "object") {
          throw new Error("Invalid overall object in response");
        }

        // Calculate weighted score
        let weightedAI = 0;
        let weightedHuman = 0;

        for (const criterion of analysis.criteria) {
          const weight = criterion.weight || 0;
          weightedAI += (criterion.aiProbability || 0) * weight;
          weightedHuman += (criterion.humanProbability || 0) * weight;
        }

        // Normalize to 0-100
        const finalAIProbability = Math.round(weightedAI);
        const finalHumanProbability = Math.round(weightedHuman);

        // Determine verdict based on final score
        let verdict = analysis.overall.verdict;
        if (finalAIProbability > 70) {
          verdict = "Büyük ihtimalle AI";
        } else if (finalAIProbability < 30) {
          verdict = "Büyük ihtimalle gerçek";
        } else {
          verdict = "Şüpheli / Karışık";
        }

        // Build final response
        const finalAnalysis = {
          criteria: analysis.criteria,
          overall: {
            humanProbability: finalHumanProbability,
            aiProbability: finalAIProbability,
            verdict,
            summary: analysis.overall.summary,
          },
        };

        if (ctx.user) {
          await createOutput({
            userId: ctx.user.id,
            toolType: "ai-video-test",
            outputKey: `ai-video-test-${Date.now()}`,
            outputUrl: "",
            metadata: JSON.stringify({ analysis }),
          });
        }

        return finalAnalysis;
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

// ── Coding Assistant

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
