import { createCardPose, touchCardPose, tableLayout } from "./cardPlacement";

test("different openings vary poses without changing the six fixed color-combination slots", () => {
  const a = Array.from({ length: 6 }, (_, i) => createCardPose(i, () => 0.1));
  const b = Array.from({ length: 6 }, (_, i) => createCardPose(i, () => 0.9));
  a.forEach((pose, i) => {
    expect(pose).not.toEqual(b[i]);
    expect(Math.abs(pose.x - ((i % 3) - 1) * 2.65)).toBeLessThan(0.021);
    expect(Math.abs(pose.z - (Math.floor(i / 3) - 0.5) * 3.72)).toBeLessThan(
      0.026,
    );
  });
});

test("repeated touches always turn the card and never accumulate drift outside the mobile frame", () => {
  for (let i = 0; i < 6; i++) {
    let pose = createCardPose(i);
    const anchor = { x: pose.anchorX, z: pose.anchorZ };
    for (let tap = 0; tap < 500; tap++) {
      const next = touchCardPose(pose);
      expect(next.angle).not.toBe(pose.angle);
      expect(next.anchorX).toBe(anchor.x);
      expect(next.anchorZ).toBe(anchor.z);
      // Full rotated card silhouette, not just its center, stays inside the camera.
      const halfExtent =
        1.35 *
        (0.9 * Math.cos(next.angle) + 1.31 * Math.abs(Math.sin(next.angle)));
      expect(Math.abs(next.x) + halfExtent).toBeLessThan(4.02);
      expect(Math.abs(next.z - anchor.z)).toBeLessThanOrEqual(0.035);
      pose = next;
    }
  }
});


test('contact side reverses torque and independent impulses vary timing, displacement and rocking', () => {
  const pose = createCardPose(0, () => 0.5);
  const left = touchCardPose(pose, () => 0.5, {x: -0.9, z: 0});
  const right = touchCardPose(pose, () => 0.5, {x: 0.9, z: 0});
  expect(left.angle).toBeLessThan(0);
  expect(right.angle).toBeGreaterThan(0);
  const soft = touchCardPose(pose, () => 0.1);
  const firm = touchCardPose(pose, () => 0.9);
  expect(soft.duration).not.toBe(firm.duration);
  expect(soft.arc).not.toBe(firm.arc);
  expect(soft.x).not.toBe(firm.x);
});


test.each([[360, 540, 2], [680, 450, 3], [900, 250, 6]])(
  'reflows six non-overlapping cards and fits whole silhouettes at %sx%s',
  (width, height, columns) => {
    const layout = tableLayout(width, height);
    expect(layout.columns).toBe(columns);
    const cards = Array.from({length:6}, (_, i) => createCardPose(i, () => 0.5, columns));
    cards.forEach(card => {
      expect(Math.abs(card.x) + 1.3).toBeLessThan(layout.halfWidth);
      expect((Math.abs(card.z) + 1.8) * 0.95).toBeLessThan(layout.halfHeight);
    });
    expect(new Set(cards.map(p => `${p.x}:${p.z}`)).size).toBe(6);
  },
);
