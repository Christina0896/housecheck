import assert from "node:assert/strict";
import test from "node:test";
import {
  extractBerRating,
  extractEircode,
  extractFloorAreaSqm,
  extractLandSize,
  extractPrice,
  normalizeDescription,
} from "../scripts/scraper/extract";

test("extracts approximate acres from listing prose", () => {
  const result = extractLandSize(
    "The residence is set on approximately 4.7 acres with paddocks and mature trees.",
  );
  assert.ok(result);
  assert.equal(result.acres, 4.7);
  assert.equal(result.approximate, true);
  assert.equal(result.sourceUnit, "acre");
});

test("converts hectares to acres", () => {
  const result = extractLandSize("The holding extends to 2.00 hectares in total.");
  assert.ok(result);
  assert.equal(result.hectares, 2);
  assert.ok(Math.abs(result.acres - 4.9421) < 0.001);
});

test("prefers property acreage over unrelated nearby acreage", () => {
  const result = extractLandSize(
    "The property stands on 3.2 acres. It enjoys views over a nearby 60 acre farm.",
  );
  assert.ok(result);
  assert.equal(result.acres, 3.2);
});

test("extracts common listing facts", () => {
  const text = "€425,000 · Floor area 185 sq m · BER rating B2";
  assert.equal(extractPrice(text), 425000);
  assert.equal(extractFloorAreaSqm(text), 185);
  assert.equal(extractBerRating(text), "B2");
});


test("extracts and formats an Eircode", () => {
  assert.equal(extractEircode("Toonlane, Co. Cork, P12YN40"), "P12 YN40");
  assert.equal(extractEircode("Dublin routing key D6W X123"), "D6W X123");
  assert.equal(extractEircode("No postal code stated"), null);
});

test("keeps paragraphs in a listing description", () => {
  assert.equal(
    normalizeDescription("First paragraph.\n\n  Second   paragraph.  "),
    "First paragraph.\n\nSecond paragraph.",
  );
});
