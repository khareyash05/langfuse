import { z } from "zod";

import {
  createTRPCRouter,
  protectedProjectProcedure,
  publicProcedure,
} from "@/src/server/api/trpc";
import { Prisma, type Score } from "@prisma/client";
import { paginationZod } from "@/src/utils/zod";

import { SendTokenInEmail } from "@/src/features/email/components/SendTokenInEmail";
import {
  hashPassword,
  verifyPassword,
} from "@/src/features/auth/lib/emailPassword";

const UserFilterOptions = z.object({
  projectId: z.string(), // Required for protectedProjectProcedure
});

const UserAllOptions = UserFilterOptions.extend({
  ...paginationZod,
});

export const userRouter = createTRPCRouter({
  findEmail: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
        },
      });
      if (user == null) return null;
      return true;
    }),
  resetPasswordLoggedOut: publicProcedure
    .input(
      z.object({
        email: z.string(),
        new_password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const hash = await hashPassword(input.new_password);
      await ctx.prisma.user.update({
        where: {
          email: input.email,
        },
        data: {
          password: hash,
        },
      });
      return true;
    }),
  resetPasswordLoggedIn: publicProcedure
    .input(
      z.object({
        email: z.string(),
        old_password: z.string(),
        new_password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
        },
      });
      const check = await verifyPassword(
        input.old_password,
        String(user?.password),
      );
      if (!check) return false;
      const hash = await hashPassword(input.new_password);
      await ctx.prisma.user.update({
        where: {
          email: input.email,
        },
        data: {
          password: hash,
        },
      });
      return true;
    }),
  tokenToEmail: publicProcedure
    .input(
      z.object({
        password_reset_token: z.string(),
        email: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await SendTokenInEmail(input.email, input.password_reset_token);
    }),
  saveToken: publicProcedure
    .input(
      z.object({
        password_reset_token: z.string(),
        email: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.update({
        where: {
          email: input.email,
        },
        data: {
          password_reset_token: input.password_reset_token,
        },
      });
      return user;
    }),

  all: protectedProjectProcedure
    .input(UserAllOptions)
    .query(async ({ input, ctx }) => {
      const users = await ctx.prisma.$queryRaw<
        {
          userId: string;
          firstTrace: Date | null;
          lastTrace: Date | null;
          totalTraces: number;
          totalPromptTokens: number;
          totalCompletionTokens: number;
          totalTokens: number;
          firstObservation: Date | null;
          lastObservation: Date | null;
          totalObservations: number;
          totalCount: number;
        }[]
      >`
        SELECT 
          t.user_id "userId",
          min(t."timestamp") "firstTrace",
          max(t."timestamp") "lastTrace",
          COUNT(distinct t.id)::int "totalTraces",
          COALESCE(SUM(o.prompt_tokens),0)::int "totalPromptTokens",
          COALESCE(SUM(o.completion_tokens),0)::int "totalCompletionTokens",
          COALESCE(SUM(o.total_tokens),0)::int "totalTokens",
          MIN(o.start_time) "firstObservation",
          MAX(o.start_time) "lastObservation",
          COUNT(distinct o.id)::int "totalObservations",
          (count(*) OVER())::int AS "totalCount"
        FROM traces t
        LEFT JOIN observations o on o.trace_id = t.id
        WHERE t.user_id is not null
        AND t.project_id = ${input.projectId}
        AND o.project_id = ${input.projectId}
        GROUP BY 1
        ORDER BY "totalTokens" DESC
        LIMIT ${input.limit}
        OFFSET ${input.page * input.limit}
      `;

      if (users.length === 0) {
        return [];
      }

      const lastScoresOfUsers = await ctx.prisma.$queryRaw<
        Array<
          Score & {
            userId: string;
          }
        >
      >`
        WITH ranked_scores AS (
          SELECT
            t.user_id,
            s.*,
            ROW_NUMBER() OVER (PARTITION BY t.user_id ORDER BY s."timestamp" DESC) AS rn 
          FROM
            scores s
            JOIN traces t ON t.id = s.trace_id
          WHERE
            s.trace_id IS NOT NULL
            AND t.project_id = ${input.projectId}
            AND t.user_id IN (${Prisma.join(users.map((user) => user.userId))})
            AND t.user_id IS NOT NULL
        )
        SELECT
          user_id "userId",
          "id",
          "timestamp",
          "name",
          "value",
          observation_id "observationId",
          trace_id "traceId",
          "comment"
        FROM
          ranked_scores
        WHERE rn = 1
      `;

      return users.map((user) => ({
        ...user,
        lastScore: lastScoresOfUsers.find(
          (score) => score.userId === user.userId,
        ),
      }));
    }),

  byId: protectedProjectProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const agg = await ctx.prisma.$queryRaw<
        {
          userId: string;
          firstTrace: Date;
          lastTrace: Date;
          totalTraces: number;
          totalPromptTokens: number;
          totalCompletionTokens: number;
          totalTokens: number;
          firstObservation: Date;
          lastObservation: Date;
          totalObservations: number;
        }[]
      >`
        SELECT 
          t.user_id "userId",
          min(t."timestamp") "firstTrace",
          max(t."timestamp") "lastTrace",
          COUNT(distinct t.id)::int "totalTraces",
          COALESCE(SUM(o.prompt_tokens),0)::int "totalPromptTokens",
          COALESCE(SUM(o.completion_tokens),0)::int "totalCompletionTokens",
          COALESCE(SUM(o.total_tokens),0)::int "totalTokens",
          MIN(o.start_time) "firstObservation",
          MAX(o.start_time) "lastObservation",
          COUNT(distinct o.id)::int "totalObservations"
        FROM traces t
        LEFT JOIN observations o on o.trace_id = t.id
        WHERE t.user_id is not null
        AND t.project_id = ${input.projectId}
        AND o.project_id = ${input.projectId}
        AND t.user_id = ${input.userId}
        GROUP BY 1
        ORDER BY "totalTokens" DESC
        LIMIT 50
      `;
      const lastScoresOfUsers = await ctx.prisma.$queryRaw<
        Array<
          Score & {
            userId: string;
          }
        >
      >`
        WITH ranked_scores AS (
          SELECT
            t.user_id,
            s.*,
            ROW_NUMBER() OVER (PARTITION BY t.user_id ORDER BY s."timestamp" DESC) AS rn 
          FROM
            scores s
            JOIN traces t ON t.id = s.trace_id
          WHERE
            s.trace_id IS NOT NULL
            AND t.project_id = ${input.projectId}
            AND t.user_id = ${input.userId}
            AND t.user_id IS NOT NULL
        )
        SELECT
          user_id "userId",
          "id",
          "timestamp",
          "name",
          "value",
          observation_id "observationId",
          trace_id "traceId",
          "comment"
        FROM
          ranked_scores
        WHERE rn = 1
      `;

      return {
        userId: input.userId,
        firstTrace: agg[0]?.firstTrace,
        lastTrace: agg[0]?.lastTrace,
        totalTraces: agg[0]?.totalTraces ?? 0,
        totalPromptTokens: agg[0]?.totalPromptTokens ?? 0,
        totalCompletionTokens: agg[0]?.totalCompletionTokens ?? 0,
        totalTokens: agg[0]?.totalTokens ?? 0,
        firstObservation: agg[0]?.firstObservation,
        lastObservation: agg[0]?.lastObservation,
        totalObservations: agg[0]?.totalObservations ?? 0,
        lastScore: lastScoresOfUsers[0],
      };
    }),
});
