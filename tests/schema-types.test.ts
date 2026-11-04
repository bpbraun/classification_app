import { describe, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import type { Guide, Marking, Paragraph, Proposal, Rule } from "../src/core/types";
import type {
  guideSchema,
  markingSchema,
  paragraphSchema,
  proposalsFileSchema,
  ruleSchema,
} from "../src/data/schema";

/** Compile-time guard: the runtime schemas and the core types can't drift apart. */
describe("schemas match the core types", () => {
  it("for rules, guides, markings, paragraphs, and proposals", () => {
    expectTypeOf<z.infer<typeof ruleSchema>>().toEqualTypeOf<Rule>();
    expectTypeOf<z.infer<typeof guideSchema>>().toEqualTypeOf<Guide>();
    expectTypeOf<z.infer<typeof markingSchema>>().toEqualTypeOf<Marking>();
    expectTypeOf<z.infer<typeof paragraphSchema>>().toEqualTypeOf<Paragraph>();
    expectTypeOf<
      z.infer<typeof proposalsFileSchema>["proposals"][number]
    >().toEqualTypeOf<Proposal>();
  });
});
