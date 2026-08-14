"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/** Estado + controles para un carrusel horizontal con flechas ida/vuelta y barra de progreso. */
export function useHorizontalScroller<T>(items: T[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [progress, setProgress] = useState(0);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < max - 4);
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);

  // Recalcula cuando cambia la cantidad de items (ej. termina de cargar la data).
  useEffect(() => {
    update();
  }, [items, update]);

  function scroll(dir: 1 | -1) {
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  return { ref, canScrollLeft, canScrollRight, progress, onScroll: update, scroll };
}

/**
 * Máscara CSS que desvanece el borde del carrusel hacia transparente cuando
 * hay más contenido para ese lado (según canScrollLeft/Right). Sin esto, la
 * última tarjeta visible se corta en seco contra el borde del contenedor —
 * con la máscara se desvanece prolijamente en vez de quedar cortada a la
 * mitad.
 */
export function edgeFadeMask(canScrollLeft: boolean, canScrollRight: boolean, size = 28) {
  const stops = [
    canScrollLeft ? "transparent" : "black",
    ...(canScrollLeft ? [`black ${size}px`] : []),
    ...(canScrollRight ? [`black calc(100% - ${size}px)`] : []),
    canScrollRight ? "transparent" : "black",
  ];
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
