import React, { useRef, useEffect } from 'react';
import {
  COLS,
  MAX_ROWS,
  CANVAS_W,
  CANVAS_H,
  CANVAS_DIMS,
  COLOR_MAP,
  BAG_MAX,
  BAG_W,
  BAG_H,
  BAG_DIMS,
} from './gameLogic';

export function GameCanvas({ board }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { CELL, PAD } = CANVAS_DIMS;

    // Clear
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines
    ctx.strokeStyle = '#ffffff18';
    ctx.lineWidth = 1;
    for (let r = 0; r <= MAX_ROWS; r++) {
      const y = r * (CELL + PAD) + PAD * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      const x = c * (CELL + PAD) + PAD * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }

    // Beads
    for (let r = 0; r < MAX_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = board[r][c];
        if (!color) continue;
        const x = PAD + c * (CELL + PAD);
        const y = PAD + r * (CELL + PAD);
        drawBead(ctx, x, y, CELL, color);
      }
    }
  }, [board]);

  return <canvas ref={canvasRef} id="game-canvas" width={CANVAS_W} height={CANVAS_H} />;
}

export function BagCanvas({ bag }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { CELL, PAD } = BAG_DIMS;

    // Clear
    ctx.clearRect(0, 0, BAG_W, BAG_H);

    // Empty slots
    for (let i = 0; i < BAG_MAX; i++) {
      const x = PAD + i * (CELL + PAD);
      const y = PAD;
      ctx.save();
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, CELL, CELL, 10);
      ctx.stroke();
      ctx.restore();
    }

    // Filled beads
    for (let i = 0; i < bag.length; i++) {
      const x = PAD + i * (CELL + PAD);
      const y = PAD;
      drawBead(ctx, x, y, CELL, bag[i]);
    }
  }, [bag]);

  return <canvas ref={canvasRef} id="bag-canvas" width={BAG_W} height={BAG_H} />;
}

function drawBead(context, x, y, size, color) {
  const scaledSize = size * CANVAS_DIMS.BEAD_SCALE;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = scaledSize / 2;

  context.save();

  const { outer } = COLOR_MAP[color];
  context.fillStyle = outer;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  context.restore();
}
