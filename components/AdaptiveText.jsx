"use client";
import { useRef, useEffect, useState } from 'react';

export default function AdaptiveText({ text, start = 50, min = 0.1, unit = 'vw', add=0 }) {
  const spanRef = useRef(null);
  const [fontSize, setFontSize] = useState(start);

  const measure = () => {
    if (!spanRef.current) return;
    const parent = spanRef.current.parentElement;
    if (!parent) return;

    const parentWidth = parent.offsetWidth;
    const parentHeight = parent.offsetHeight;

    let size = start;
    spanRef.current.style.fontSize = `${size}${unit}`;

    let guard = 0;
    while (
      (spanRef.current.offsetWidth > parentWidth || spanRef.current.offsetHeight > parentHeight) &&
      size > min && guard < 2000
    ) {
      size -= 0.1;
      spanRef.current.style.fontSize = `${size}${unit}`;
      guard++;
    }

    setFontSize(size);
  };

  useEffect(() => {
    measure();
  }, [text]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    let ro;
    if (typeof ResizeObserver !== 'undefined' && spanRef.current?.parentElement) {
      ro = new ResizeObserver(onResize);
      ro.observe(spanRef.current.parentElement);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <span
      ref={spanRef}
      style={{
        fontSize: `${fontSize+add}${unit}`,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      <strong>{text}</strong>
    </span>
  );
}