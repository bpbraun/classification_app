import type { Guide } from "../../src/core/types";

/** Hand-entered copy of ISOO's sample guide, used only as a test oracle for the core. */
export const threeLittlePigs: Guide = {
  id: "project-three-little-pigs",
  title: "Security Classification Guide: Project Three Little Pigs",
  issuedBy: "Information Security Oversight Office",
  date: "2018-08-15",
  originalClassificationAuthority: "James Halliwell-Phillipps",
  sourceUrl: "https://www.archives.gov/files/isoo/training/scg-handbook.pdf",
  rules: [
    rule("project-name", "Project name", "U", [], null, [], 1),
    rule("existence-of-pigs", "The existence of pigs", "U", [], null, [], 2),
    rule("existence-of-wolf", "The existence of the wolf", "U", [], null, [], 3),
    rule("building-material", "Building material of houses", "S", ["1.4(a)"], 10, [], 4),
    rule("destroy-methods", "Methods used to destroy houses", "S", ["1.4(c)"], 25, [], 5),
    rule("entry-points", "Entry points into houses", "TS", ["1.4(c)"], 25, ["NOFORN"], 6),
    rule("advice-from-mom", "Advice from Mom", "U", [], null, [], 7),
  ],
};

function rule(
  id: string,
  element: string,
  level: Guide["rules"][number]["level"],
  reasons: string[],
  durationYears: number | null,
  controls: string[],
  row: number,
): Guide["rules"][number] {
  return { id, element, level, reasons, durationYears, controls, source: { page: 12, row } };
}
