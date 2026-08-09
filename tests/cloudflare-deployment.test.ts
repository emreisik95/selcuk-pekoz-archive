import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("Cloudflare production deployment is reproducible from the repository", () => {
  const pkg = JSON.parse(read("package.json")) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.match(pkg.scripts?.preview ?? "", /opennextjs-cloudflare/);
  assert.match(pkg.scripts?.deploy ?? "", /opennextjs-cloudflare/);
  assert.ok(pkg.devDependencies?.["@opennextjs/cloudflare"]);
  assert.ok(pkg.devDependencies?.wrangler);

  for (const path of ["wrangler.jsonc", "open-next.config.ts", "public/_headers"]) {
    assert.equal(existsSync(path), true, `${path} should exist`);
  }

  const wrangler = read("wrangler.jsonc");
  assert.match(wrangler, /"name": "selcuk-pekoz-archive"/);
  assert.match(wrangler, /"main": "\.open-next\/worker\.js"/);
  assert.match(wrangler, /"compatibility_date": "2026-08-08"/);
  assert.match(wrangler, /"nodejs_compat"/);
  assert.match(wrangler, /"binding": "ADMIN_DATA"/);
  assert.match(read("open-next.config.ts"), /defineCloudflareConfig/);
  assert.match(read("public/_headers"), /Cache-Control: public,max-age=31536000,immutable/);
  assert.match(read(".gitignore"), /\.open-next/);
});
