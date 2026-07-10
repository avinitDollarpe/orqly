import confetti from "canvas-confetti";

export function burstConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  void confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.55 },
    colors: ["#ff5a19", "#14DB7F", "#d0dbda", "#ffc107", "#2563EB"],
  });
}
