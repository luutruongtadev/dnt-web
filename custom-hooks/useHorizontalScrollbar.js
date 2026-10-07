"use client";
import { useEffect, useRef } from "react";

export default function useHorizontalScrollbar() {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  const isThumbDraggingRef = useRef(false);
  const thumbStartXRef = useRef(0);
  const thumbStartLeftRef = useRef(0);

  // Update thumb size/position on scroll/resize/content changes
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!container || !track || !thumb) return;

    const updateThumb = () => {
      const ratio = container.clientWidth / container.scrollWidth;
      const trackWidth = track.clientWidth;
      const thumbWidth = Math.max(20, trackWidth * ratio);
      const scrollLeft = container.scrollLeft;
      const maxScroll = Math.max(1, container.scrollWidth - container.clientWidth);
      const left = (scrollLeft / maxScroll) * (trackWidth - thumbWidth);
      thumb.style.width = `${thumbWidth}px`;
      thumb.style.transform = `translateX(${left}px)`;
      thumb.style.opacity = ratio >= 1 ? "0.35" : "1";
    };

    container.addEventListener("scroll", updateThumb);
    window.addEventListener("resize", updateThumb);

    // Observe content/layout changes that affect scrollWidth/clientWidth
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateThumb);
      ro.observe(container);
      ro.observe(track);
    }

    // Initial update
    updateThumb();

    return () => {
      container.removeEventListener("scroll", updateThumb);
      window.removeEventListener("resize", updateThumb);
      if (ro) ro.disconnect();
    };
  }, []);

  // Enable click-and-hold drag to horizontal scroll on the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isInteractive = (el) => el.closest("input, select, textarea, button, a");

    const onPointerDown = (e) => {
      if (isInteractive(e.target)) return;
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startScrollLeftRef.current = container.scrollLeft;
      try {
        container.setPointerCapture && container.setPointerCapture(e.pointerId);
      } catch {}
      container.style.cursor = "grabbing";
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startXRef.current;
      container.scrollLeft = startScrollLeftRef.current - dx;
    };

    const endDrag = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      try {
        container.releasePointerCapture && container.releasePointerCapture(e.pointerId);
      } catch {}
      container.style.cursor = "";
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", endDrag);
    container.addEventListener("pointerleave", endDrag);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", endDrag);
      container.removeEventListener("pointerleave", endDrag);
    };
  }, []);

  // Enable dragging the scrollbar thumb to control horizontal scroll
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!container || !track || !thumb) return;

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    const onThumbDown = (e) => {
      isThumbDraggingRef.current = true;
      thumbStartXRef.current = e.clientX;
      const leftNow = parseFloat(getComputedStyle(thumb).left) || 0;
      thumbStartLeftRef.current = leftNow;
      try {
        thumb.setPointerCapture && thumb.setPointerCapture(e.pointerId);
      } catch {}
      thumb.style.cursor = "grabbing";
      e.preventDefault();
    };

    const onThumbMove = (e) => {
      if (!isThumbDraggingRef.current) return;
      const trackWidth = track.clientWidth;
      const thumbWidth = thumb.offsetWidth;
      const dx = e.clientX - thumbStartXRef.current;
      const newLeft = clamp(thumbStartLeftRef.current + dx, 0, trackWidth - thumbWidth);
      thumb.style.left = `${newLeft}px`;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const maxThumb = trackWidth - thumbWidth;
      const ratio = maxThumb > 0 ? newLeft / maxThumb : 0;
      container.scrollLeft = ratio * maxScroll;
    };

    const endThumbDrag = (e) => {
      if (!isThumbDraggingRef.current) return;
      isThumbDraggingRef.current = false;
      try {
        thumb.releasePointerCapture && thumb.releasePointerCapture(e.pointerId);
      } catch {}
      thumb.style.cursor = "";
    };

    thumb.addEventListener("pointerdown", onThumbDown);
    window.addEventListener("pointermove", onThumbMove);
    window.addEventListener("pointerup", endThumbDrag);
    window.addEventListener("pointerleave", endThumbDrag);

    return () => {
      thumb.removeEventListener("pointerdown", onThumbDown);
      window.removeEventListener("pointermove", onThumbMove);
      window.removeEventListener("pointerup", endThumbDrag);
      window.removeEventListener("pointerleave", endThumbDrag);
    };
  }, []);

  return { containerRef, trackRef, thumbRef };
}