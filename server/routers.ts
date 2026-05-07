import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { presentationRouter, logoRouter, voiceRouter, videoRouter, codingRouter, uploadRouter, videoTestRouter } from "./routers/tools";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  presentation: presentationRouter,
  logo: logoRouter,
  voice: voiceRouter,
  video: videoRouter,
  videoTest: videoTestRouter,
  coding: codingRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
