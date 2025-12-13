'use client';

import React, { useEffect, useRef } from 'react';

interface BallpitBackgroundProps {
  className?: string;
  count?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  followCursor?: boolean;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  maxVelocity?: number;
  sizeZ?: number;
  maxX?: number;
  maxY?: number;
}

export const BallpitBackground: React.FC<BallpitBackgroundProps> = ({
  className,
  count = 200,
  gravity = 0.5,
  friction = 0.9975,
  wallBounce = 0.95,
  followCursor = true,
  colors = [
    '#3B82F6', // blue
    '#6366F1', // indigo
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#F97316', // orange
    '#F59E0B', // amber
  ],
  minSize = 0.5,
  maxSize = 1,
  maxVelocity = 0.15,
  sizeZ = 1,
  maxX = 5,
  maxY = 5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const cursorPosRef = useRef({ x: 0, y: 0 });

  // Track cursor position
  useEffect(() => {
    if (!followCursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorPosRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [followCursor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Ball class
    class Ball {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * (maxSize - minSize) + minSize;
        const randomIndex = Math.floor(Math.random() * colors.length);
        this.color = colors[randomIndex] || '#3B82F6';
      }

      update(canvasWidth: number, canvasHeight: number) {
        // Apply gravity
        this.vy += gravity;

        // Apply friction
        this.vx *= friction;
        this.vy *= friction;

        // Limit velocity
        this.vx = Math.max(-maxVelocity, Math.min(maxVelocity, this.vx));
        this.vy = Math.max(-maxVelocity, Math.min(maxVelocity, this.vy));

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x + this.radius > canvasWidth) {
          this.x = canvasWidth - this.radius;
          this.vx *= -wallBounce;
        } else if (this.x - this.radius < 0) {
          this.x = this.radius;
          this.vx *= -wallBounce;
        }

        if (this.y + this.radius > canvasHeight) {
          this.y = canvasHeight - this.radius;
          this.vy *= -wallBounce;
        } else if (this.y - this.radius < 0) {
          this.y = this.radius;
          this.vy *= -wallBounce;
        }
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.globalAlpha = 0.3;
        context.fill();
        context.closePath();
      }
    }

    // Create balls
    const balls = Array.from({ length: count }, () => new Ball(canvas.width, canvas.height));

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      balls.forEach((ball) => {
        ball.update(canvas.width, canvas.height);
        ball.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [count, gravity, friction, wallBounce, followCursor, colors, minSize, maxSize, maxVelocity, sizeZ, maxX, maxY]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 -z-10 ${className}`}
      aria-hidden="true"
    />
  );
};
