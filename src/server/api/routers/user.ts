import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getTokens: protectedProcedure.query(async ({ ctx }) => {
    const chatTokens = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        chatTokens: true,
      },
    });
    return chatTokens;
  }),
  updateTokens: protectedProcedure
    .input(
      z.object({
        tokens: z.number().optional(),
      })
    )
    .query(({ input, ctx }) => {
      return ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          chatTokens: input.tokens,
        },
      });
    }),
});
