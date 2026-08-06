import { describe, expect, it } from "vitest";

import { bool, num, parseCsv, str, toCsv } from "../csv";

describe("toCsv", () => {
  it("writes a header row even when there are zero data rows, given explicit columns", () => {
    // Regression test for the bug found while fixing P6: choice-similarity.csv
    // and consequence-similarity.csv used to come out completely empty (not
    // even a header) whenever no pair cleared the similarity threshold, which
    // made "0 rows" indistinguishable from "the script crashed before writing
    // anything".
    const csv = toCsv([], ["a", "b", "similarity"]);
    expect(csv).toBe("a,b,similarity\n");
  });

  it("round-trips through parseCsv", () => {
    const rows = [
      { id: "x", value: "1" },
      { id: "y", value: "2" },
    ];
    const parsed = parseCsv(toCsv(rows));
    expect(parsed).toEqual(rows);
  });

  it("quotes cells containing commas or newlines", () => {
    const csv = toCsv([{ text: "a, b\nc" }], ["text"]);
    const parsed = parseCsv(csv);
    expect(parsed[0]?.text).toBe("a, b\nc");
  });
});

describe("num/bool/str", () => {
  it("defaults missing numeric fields to 0, not NaN", () => {
    expect(num(undefined)).toBe(0);
    expect(num("")).toBe(0);
    expect(num("3.5")).toBe(3.5);
  });

  it("only treats the literal string 'true' as boolean true", () => {
    expect(bool("true")).toBe(true);
    expect(bool("false")).toBe(false);
    expect(bool(undefined)).toBe(false);
    expect(bool("1")).toBe(false);
  });

  it("defaults missing string fields to an empty string", () => {
    expect(str(undefined)).toBe("");
    expect(str("x")).toBe("x");
  });
});
