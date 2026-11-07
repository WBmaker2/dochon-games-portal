import { useEffect, useRef } from 'react';

/**
 * Shared canvas helper: owns canvasRef, high-DPI scaling (capped at 2x),
 * resize handling, and canvas-coordinate translation for pointer input.
 *
 * Usage:
 *   const { canvasRef, toCanvasCoords } = useGameCanvas(width, height);
 *   <canvas ref={canvasRef} width={width} height={height} />
 *
 * Games adopt this progressively (piratecoin's resize listener was the only
 * existing implementation). The logical width/height constants stay per-game.
 */
export function useGameCanvas(logicalWidth, logicalHeight) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const applyDpr = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scaledWidth = Math.round(logicalWidth * dpr);
      const scaledHeight = Math.round(logicalHeight * dpr);
      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
      }
    };

    applyDpr();
    window.addEventListener('resize', applyDpr);
    return () => window.removeEventListener('resize', applyDpr);
  }, [logicalWidth, logicalHeight]);

  const toCanvasCoords = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  return { canvasRef, toCanvasCoords };
}
