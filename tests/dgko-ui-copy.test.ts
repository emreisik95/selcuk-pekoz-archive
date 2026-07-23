import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const experienceSource = readFileSync(
  new URL("../app/dgko/BirthdayExperience.tsx", import.meta.url),
  "utf8",
);
const experienceStyles = readFileSync(
  new URL("../app/dgko/dgko.css", import.meta.url),
  "utf8",
);

test("the film contains no decorative technical HUD copy", () => {
  assert.doesNotMatch(
    experienceSource,
    /DGKO \/\/ YILLIK KAYIT|BIRTHDAY TRANSMISSION|SESSİZ OTOMATİK OYNATIM/,
  );
});

test("the finale uses the pastel gallery room and explicitly colored confetti", () => {
  assert.match(experienceSource, /finalStage/);
  assert.match(experienceSource, /dgko-confetti/);
  assert.match(experienceStyles, /#ff5c8a/);
  assert.match(experienceStyles, /#55d6be/);
  assert.match(experienceStyles, /#ffd166/);
});

test("video frames stay mounted through their complete exit animation", () => {
  assert.doesNotMatch(experienceSource, /if \(!projection\.visible\) return null/);
});

test("the finished recap can produce a native share image", () => {
  assert.match(experienceSource, /createShareImage/);
  assert.match(experienceSource, /navigator\.share/);
  assert.match(experienceSource, /selectedRecapKeys/);
  assert.match(experienceSource, /Tümünü seç/);
  assert.match(experienceSource, /mostViewed/);
  assert.match(experienceSource, /longestStream/);
});

test("the finale uses authored, textured GLB assets instead of primitive toy shapes", () => {
  assert.doesNotMatch(experienceSource, /finale-room\.webp/);
  assert.match(experienceSource, /question-block-hq\.glb/);
  assert.match(experienceSource, /super-mushroom-hq\.glb/);
  assert.match(experienceSource, /candy-cake-hq\.glb/);
  assert.match(experienceSource, /switch-oled-hq\.glb/);
  assert.match(experienceSource, /stylised-gifts-hq\.glb/);
  assert.match(experienceSource, /stylized-clouds-hq\.glb/);
  assert.match(experienceSource, /stylized-bush-hq\.glb/);
  assert.match(experienceSource, /grass-patches-hq\.glb/);
  assert.doesNotMatch(experienceSource, /function makeQuestionBlock/);
  assert.doesNotMatch(experienceSource, /function makeMushroom/);
  assert.doesNotMatch(experienceSource, /function makeGift/);
  assert.doesNotMatch(experienceSource, /function makeCake/);
});

test("the gallery renderer uses real-time shadows for grounded product lighting", () => {
  assert.match(experienceSource, /renderer\.shadowMap\.enabled\s*=\s*true/);
  assert.match(experienceSource, /PCFSoftShadowMap/);
});

test("the film waits for its GLB gallery assets before starting the timeline", () => {
  assert.match(experienceSource, /new THREE\.LoadingManager/);
  assert.match(experienceSource, /runtime\.ready/);
});

test("shorts are real WebGL video textures recessed into the travelling wall frames", () => {
  assert.match(experienceSource, /getTunnelPanelDepth/);
  assert.match(experienceSource, /new THREE\.VideoTexture/);
  assert.match(experienceSource, /wallVideoScreens/);
  assert.match(experienceSource, /flatMap/);
  assert.match(experienceSource, /video\.play\(\)/);
  assert.doesNotMatch(experienceSource, /<iframe/);
  assert.doesNotMatch(experienceSource, /dgko-panels/);
  assert.doesNotMatch(experienceSource, /const wallDistance = 42/);
});

test("console models enter from the fog and leave behind the camera instead of popping", () => {
  assert.match(experienceSource, /placeTravellingStage/);
  assert.doesNotMatch(experienceSource, /gameBoyStage\.position\.set\(-3\.15, -2\.52, -9\.85\)/);
  assert.doesNotMatch(experienceSource, /switchStage\.position\.set\(3\.2, -2\.52, -10\.1\)/);
});

test("the Game Boy faces front and wall ribs share the floor travel clock", () => {
  assert.match(experienceSource, /gameBoyFacing\.rotation\.y\s*=\s*0/);
  assert.match(experienceSource, /wallRibs/);
  assert.match(experienceSource, /wrapDepth\(-14 - index \* 14 \+ travel\)/);
});

test("the corridor has travelling clouds, grass and mushrooms without global bloom", () => {
  assert.match(experienceSource, /travellingNature/);
  assert.match(experienceSource, /placeTrackModel/);
  assert.match(experienceSource, /getGroundedModelY/);
  assert.doesNotMatch(experienceSource, /UnrealBloomPass/);
});

test("the floor gains irregular travelling dirt path sections", () => {
  assert.match(experienceSource, /makeDirtPath/);
  assert.match(experienceSource, /dirtPathSegments/);
  assert.match(experienceSource, /wrapBuffer/);
  assert.match(experienceSource, /makeDirtPath\(index\)[\s\S]*24/);
});

test("wall videos and readable chapter copy are authored as 3D scene elements", () => {
  assert.match(experienceSource, /createCrtMaterial/);
  assert.match(experienceSource, /new THREE\.CanvasTexture/);
  assert.match(experienceSource, /chapterBillboard/);
  assert.match(experienceSource, /isCompact \? 0\.66 : 1/);
  assert.match(experienceSource, /new THREE\.Fog\(0x7163a3, 30, 150\)/);
  assert.match(experienceSource, /isCompact \? 150 : 190/);
});
