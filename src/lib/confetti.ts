import confetti from "canvas-confetti";

export function burstConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#ff5a19", "#14DB7F", "#d0dbda", "#ffc107", "#2563EB"];
  // Center burst plus two angled side cannons.
  void confetti({
    particleCount: 180,
    spread: 90,
    origin: { y: 0.55 },
    colors,
  });
  void confetti({
    particleCount: 60,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    colors,
  });
  void confetti({
    particleCount: 60,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    colors,
  });
}
