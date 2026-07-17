import assert from "node:assert/strict";
import test from "node:test";
import { classifySettings, haversineKm } from "../scripts/scraper/environment";

test("classifies close water and woodland", () => {
  const settings = classifySettings({
    lakeKm: 0.3,
    coastKm: 4.2,
    forestKm: 0.1,
    townKm: null,
  });
  assert.ok(settings.some((setting) => setting.label === "Lakeside"));
  assert.ok(settings.some((setting) => setting.label === "Near coast"));
  assert.ok(settings.some((setting) => setting.label === "Forest edge"));
});

test("haversine distance is zero for the same point", () => {
  assert.equal(haversineKm({ lat: 53, lon: -8 }, { lat: 53, lon: -8 }), 0);
});
