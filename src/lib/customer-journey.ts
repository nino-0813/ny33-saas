import { z } from "zod";

export const JourneyStageKeySchema = z.enum([
  "awareness",
  "interest",
  "action",
  "comparison",
  "purchase",
  "usage",
  "loyalty",
]);

export type JourneyStageKey = z.infer<typeof JourneyStageKeySchema>;

export const JourneyStageSchema = z.object({
  key: JourneyStageKeySchema,
  name: z.string().min(1).max(20),
  story: z.string().min(1).max(240),
  actions: z.array(z.string().min(1).max(120)).min(1).max(4),
  thoughts: z.array(z.string().min(1).max(120)).min(1).max(4),
  hurdles: z.array(z.string().min(1).max(120)).min(1).max(4),
  measures: z.array(z.string().min(1).max(120)).min(1).max(4),
});

export const JourneyPlanSchema = z.object({
  productSummary: z.string().min(1).max(300),
  targetCustomer: z.string().min(1).max(180),
  positioning: z.string().min(1).max(240),
  stages: z.array(JourneyStageSchema).length(7),
  sources: z
    .array(
      z.object({
        title: z.string().min(1).max(180),
        url: z.string().url(),
      }),
    )
    .max(8)
    .default([]),
  researched: z.boolean(),
});

export type JourneyPlan = z.infer<typeof JourneyPlanSchema>;

export interface JourneyProductInput {
  productName: string;
  description: string;
  targetCustomer: string;
  price: string;
  url: string;
}

export const JOURNEY_STAGE_ORDER: JourneyStageKey[] = [
  "awareness",
  "interest",
  "action",
  "comparison",
  "purchase",
  "usage",
  "loyalty",
];

