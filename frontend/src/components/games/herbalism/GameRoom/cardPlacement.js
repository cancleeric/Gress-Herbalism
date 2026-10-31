// Visual-only poses: stable for one mounted game, unrelated to cards or AI randomness.
export function createCardPose(index, random = Math.random, columns = 3) {
  const x = ((index % columns) - (columns - 1) / 2) * 2.65 + (random() - 0.5) * 0.04;
  const z = (Math.floor(index / columns) - (6 / columns - 1) / 2) * 3.72 + (random() - 0.5) * 0.05;
  const angle = (random() - 0.5) * 0.05;
  return { x, z, angle, anchorX: x, anchorZ: z, touches: 0 };
}

export function touchCardPose(
  pose,
  random = Math.random,
  contact = { x: 0, z: 0 },
) {
  // Off-center contact supplies torque. Center taps get independently varied impulses.
  const torque = contact.x * 0.7 - contact.z * 0.25 + (random() - 0.5) * 0.9;
  const sign = torque < 0 ? -1 : 1;
  const impulse = 0.018 + random() * 0.031;
  return {
    ...pose,
    x: pose.anchorX + (random() - 0.5) * 0.06,
    z: pose.anchorZ + (random() - 0.5) * 0.07,
    angle: sign * impulse,
    touches: pose.touches + 1,
    duration: 240 + random() * 210,
    arc: 0.025 + random() * 0.09,
    rock: sign * (0.008 + random() * 0.018),
  };
}

// Fit all six complete silhouettes; choose a different composition, not a stretched phone table.
export function tableLayout(width, height) {
  const aspect = width / Math.max(1, height);
  const columns = aspect < 0.82 ? 2 : aspect > 2.65 ? 6 : 3;
  const rows = 6 / columns;
  const contentWidth = (columns - 1) * 2.65 + 2.7;
  const contentHeight = ((rows - 1) * 3.72 + 3.8) * 0.95;
  const halfHeight = Math.max(contentHeight / 2, contentWidth / (2 * aspect)) * 1.04;
  return { columns, halfHeight, halfWidth: halfHeight * aspect };
}
