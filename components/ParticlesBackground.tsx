"use client";

export function ParticlesBackground() {
  const count = 40;
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 1 + (i % 3),
    left: (i * 7 + 13) % 100,
    top: (i * 11 + 17) % 100,
    delay: (i * 0.3) % 5,
    duration: 15 + (i % 10),
  }));

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
      aria-hidden
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-muted-foreground/20 dark:bg-muted-foreground/10 animate-float"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
