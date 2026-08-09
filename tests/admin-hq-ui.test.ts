import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("admin opens on an overview without removing existing tools", () => {
  const panel = read("app/admin/panel/AdminPanel.tsx");

  assert.match(panel, /type Tab = "overview" \| "events" \| "content" \| "system"/);
  assert.match(panel, /tabParam === "events"/);
  assert.match(panel, /: "overview"/);
  for (const tab of ["Genel bakış", "Etkinlikler", "İçerik", "Sistem"]) {
    assert.match(panel, new RegExp(tab));
  }
  assert.match(panel, /<AdminOverview/);
  assert.match(panel, /<EventsTab/);
  assert.match(panel, /<ContentTab/);
  assert.match(panel, /<SystemTab/);
});

test("admin overview exposes state, health, coverage and publishing actions", () => {
  const path = "components/admin/AdminOverview.tsx";
  assert.equal(existsSync(path), true, "AdminOverview should exist");
  const overview = read(path);

  for (const label of [
    "Yayın durumu",
    "Veri sağlığı",
    "İçerik kapsamı",
    "Yayınlama durumu",
  ]) {
    assert.match(overview, new RegExp(label));
  }
  assert.match(overview, /Henüz başarılı bir senkron kaydı yok/);
  for (const tab of ["events", "content", "system"]) {
    assert.match(overview, new RegExp(`\\?t=${tab}`));
  }
  assert.doesNotMatch(overview, /webhookToken|pubsub\.secret|ADMIN_PASSWORD/);
});

test("authenticated admin page builds only the safe overview model", () => {
  const page = read("app/admin/panel/page.tsx");

  assert.match(page, /buildAdminOverview/);
  assert.match(page, /getShorts/);
  assert.match(page, /initialOverview=/);
});
