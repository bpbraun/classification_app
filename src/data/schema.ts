import { z } from "zod";
import { LEVELS } from "../core/types";

/** Runtime schemas for every file that crosses a trust boundary (PDF output, model output). */

const level = z.enum(LEVELS);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const id = z.string().regex(/^[a-z0-9-]{1,64}$/);
/** Links rendered on the page must be HTTPS, never javascript: or data: URLs. */
const httpsUrl = z.url().refine((u) => u.startsWith("https://"), "Must be an https:// URL");

export const markingSchema = z.object({ level, controls: z.array(z.string().max(40)).max(10) });

export const ruleSchema = z.object({
  id,
  element: z.string().min(1).max(300),
  level,
  reasons: z.array(z.string().regex(/^1\.4\([a-h]\)$/)).max(8),
  durationYears: z.number().int().min(1).max(75).nullable(),
  controls: z.array(z.string().max(40)).max(10),
  source: z.object({ page: z.number().int().positive(), row: z.number().int().positive() }),
}).refine((r) => r.level === "U" || r.durationYears !== null, {
  message: "A classified rule needs a duration",
});

export const guideSchema = z.object({
  id,
  title: z.string().min(1).max(200),
  issuedBy: z.string().min(1).max(200),
  date: isoDate,
  originalClassificationAuthority: z.string().min(1).max(200),
  sourceUrl: httpsUrl,
  rules: z.array(ruleSchema).min(1).max(500),
});

export const paragraphSchema = z.object({ id, text: z.string().min(1).max(5000) });

export const extractedSchema = z.object({
  source: z.object({
    url: httpsUrl,
    title: z.string(),
    publisher: z.string(),
    published: z.string(),
    sha256,
    pages: z.record(z.string(), z.number().int().positive()),
  }),
  guide: guideSchema,
  examples: z.array(guideSchema).length(2),
  exercise: z.object({ paragraphs: z.array(paragraphSchema).min(1).max(200) }),
  answerKey: z.object({
    banner: z.string(),
    documentDate: isoDate,
    authorityBlock: z.object({
      classifiedBy: z.string(),
      derivedFrom: z.string(),
      declassifyOn: z.string(),
      /** The same date as ISO YYYY-MM-DD, for comparison. */
      declassifyOnDate: isoDate,
    }),
    paragraphs: z.array(
      z.object({ paragraphId: id, marking: markingSchema, note: z.string().optional() }),
    ),
  }),
});
export type ExtractedData = z.infer<typeof extractedSchema>;

/** What the model must return for one paragraph. Anything else is rejected. */
export const modelAnswerSchema = z.strictObject({
  citedRuleIds: z.array(id).max(20),
  rationale: z.string().min(1).max(600),
});

export const proposalsFileSchema = z.object({
  provenance: z.object({
    kind: z.enum(["model", "development-fixture"]),
    description: z.string(),
    model: z.string().regex(/^claude-[a-z0-9.-]+$/).nullable(),
    promptTemplateSha256: sha256.nullable(),
    sourceSha256: sha256,
    /** Fingerprint of the rule ids and elements the model was shown. */
    guideSha256: sha256.nullable(),
    createdAt: z.iso.datetime(),
  }),
  proposals: z.array(
    z.object({ paragraphId: id, citedRuleIds: z.array(id), rationale: z.string() }),
  ),
});
export type ProposalsFile = z.infer<typeof proposalsFileSchema>;
