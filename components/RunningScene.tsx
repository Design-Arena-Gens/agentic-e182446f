'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

type WolfState = {
  x: number;
  y: number;
  phase: number;
  strideSpeed: number;
};

type Firefly = {
  x: number;
  y: number;
  radius: number;
  drift: number;
  phase: number;
};

const createWolves = (): WolfState[] =>
  Array.from({ length: 4 }, (_, index) => ({
    x: BASE_WIDTH * 0.25 - 180 - index * 110,
    y: BASE_HEIGHT * 0.69 + index * 8,
    phase: Math.random() * Math.PI * 2,
    strideSpeed: 7 + index * 0.6
  }));

const createFireflies = (): Firefly[] =>
  Array.from({ length: 36 }, () => ({
    x: Math.random() * BASE_WIDTH,
    y: Math.random() * (BASE_HEIGHT * 0.55),
    radius: Math.random() * 1.6 + 0.7,
    drift: Math.random() * 0.3 + 0.12,
    phase: Math.random() * Math.PI * 2
  }));

function beginRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  beginRoundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
}

function drawBackground(ctx: CanvasRenderingContext2D, offset: number, canopyOffset: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
  gradient.addColorStop(0, '#0b2823');
  gradient.addColorStop(0.5, '#04130f');
  gradient.addColorStop(1, '#020807');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  drawMist(ctx);
  drawTreeLayer(ctx, offset * 0.25, '#0a3027', '#061914', 1.35, 18, 0.45, 190);
  drawTreeLayer(ctx, offset * 0.45, '#0f3d32', '#07241d', 1.15, 20, 0.4, 240);
  drawTreeLayer(ctx, offset * 0.75, '#124e3f', '#0a2d25', 1, 22, 0.32, 280);
  drawCanopyLayer(ctx, canopyOffset);
}

function drawMist(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const mistGradient = ctx.createLinearGradient(0, BASE_HEIGHT * 0.55, 0, BASE_HEIGHT * 0.85);
  mistGradient.addColorStop(0, 'rgba(73, 196, 165, 0.08)');
  mistGradient.addColorStop(1, 'rgba(6, 31, 24, 0.05)');
  ctx.fillStyle = mistGradient;
  ctx.fillRect(0, BASE_HEIGHT * 0.45, BASE_WIDTH, BASE_HEIGHT * 0.4);
  ctx.restore();
}

function drawTreeLayer(
  ctx: CanvasRenderingContext2D,
  offset: number,
  foliageColor: string,
  trunkColor: string,
  scale: number,
  count: number,
  variance: number,
  baseHeight: number
) {
  ctx.save();
  ctx.translate(-(offset % BASE_WIDTH), 0);
  for (let i = -1; i < count + 1; i += 1) {
    const x = (i * BASE_WIDTH) / count;
    const width = 80 * scale * (1 + Math.sin(i * 12.9898) * variance);
    const height = baseHeight * (1 + Math.cos(i * 8.233) * variance);

    ctx.fillStyle = trunkColor;
    ctx.fillRect(x + width * 0.4, BASE_HEIGHT - height, width * 0.18, height);

    ctx.beginPath();
    ctx.fillStyle = foliageColor;
    ctx.ellipse(
      x + width * 0.5,
      BASE_HEIGHT - height - width * 0.1,
      width,
      height * 0.65,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawCanopyLayer(ctx: CanvasRenderingContext2D, canopyOffset: number) {
  ctx.save();
  ctx.translate(-(canopyOffset % BASE_WIDTH), 0);
  ctx.fillStyle = '#081f18';
  for (let i = -1; i < 8; i += 1) {
    const x = i * (BASE_WIDTH / 6);
    ctx.beginPath();
    ctx.moveTo(x, BASE_HEIGHT * 0.25);
    ctx.bezierCurveTo(
      x + BASE_WIDTH * 0.15,
      BASE_HEIGHT * 0.05,
      x + BASE_WIDTH * 0.35,
      BASE_HEIGHT * 0.05,
      x + BASE_WIDTH * 0.5,
      BASE_HEIGHT * 0.25
    );
    ctx.lineTo(x + BASE_WIDTH * 0.5, BASE_HEIGHT * 0.3);
    ctx.lineTo(x, BASE_HEIGHT * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.save();
  const groundHeight = BASE_HEIGHT * 0.3;
  const baseY = BASE_HEIGHT - groundHeight;

  const groundGradient = ctx.createLinearGradient(0, baseY, 0, BASE_HEIGHT);
  groundGradient.addColorStop(0, '#0b261f');
  groundGradient.addColorStop(1, '#040e0c');
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, baseY, BASE_WIDTH, groundHeight);

  const stripWidth = 160;
  const totalStrips = Math.ceil(BASE_WIDTH / stripWidth) + 2;
  ctx.translate(-(offset % stripWidth), 0);
  for (let i = 0; i < totalStrips; i += 1) {
    const x = i * stripWidth;
    const ridgeHeight = Math.sin((offset / 100 + i) * 0.9) * 22 + 24;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(12, 57, 44, 0.45)' : 'rgba(7, 29, 24, 0.35)';
    ctx.beginPath();
    ctx.moveTo(x, baseY + ridgeHeight);
    ctx.bezierCurveTo(
      x + stripWidth * 0.25,
      baseY + ridgeHeight - 15,
      x + stripWidth * 0.75,
      baseY + ridgeHeight + 12,
      x + stripWidth,
      baseY + ridgeHeight
    );
    ctx.lineTo(x + stripWidth, BASE_HEIGHT);
    ctx.lineTo(x, BASE_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBoy(ctx: CanvasRenderingContext2D, x: number, y: number, stride: number) {
  ctx.save();
  ctx.translate(x, y);

  const bobbing = Math.sin(stride * 0.8) * 8;
  ctx.translate(0, -bobbing);

  ctx.fillStyle = '#f7d3b7';
  ctx.beginPath();
  ctx.arc(0, -96, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1b1d24';
  ctx.beginPath();
  ctx.moveTo(-18, -112);
  ctx.lineTo(18, -112);
  ctx.lineTo(12, -98);
  ctx.lineTo(-10, -92);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1f6feb';
  fillRoundedRect(ctx, -16, -94, 32, 55, 12);

  ctx.strokeStyle = '#f7d3b7';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-16, -72);
  ctx.quadraticCurveTo(-34, -64, -28, -40 - Math.sin(stride) * 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(16, -72);
  ctx.quadraticCurveTo(30, -62, 34, -36 + Math.sin(stride) * 12);
  ctx.stroke();

  ctx.fillStyle = '#20232f';
  fillRoundedRect(ctx, -16, -44, 32, 44, 10);

  ctx.strokeStyle = '#0f1218';
  ctx.lineWidth = 7;
  const legSwing = Math.sin(stride) * 16;
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  ctx.lineTo(-18 - legSwing, 44);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.lineTo(18 + legSwing, 44);
  ctx.stroke();

  ctx.fillStyle = '#0b5b42';
  fillRoundedRect(ctx, -12, 44, 20, 8, 4);
  fillRoundedRect(ctx, -5, 44, 20, 8, 4);

  ctx.restore();
}

function drawWolf(ctx: CanvasRenderingContext2D, wolf: WolfState, stride: number, index: number) {
  ctx.save();
  ctx.translate(wolf.x, wolf.y);

  const bobbing = Math.sin(wolf.phase * 0.9 + index) * 6;
  ctx.translate(0, bobbing);

  const bodyColor = '#3d434f';
  const underColor = '#252930';

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, -26, 48, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(42, -40, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = underColor;
  ctx.beginPath();
  ctx.moveTo(56, -38);
  ctx.lineTo(70, -52);
  ctx.lineTo(50, -46);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(58, -36);
  ctx.lineTo(74, -32);
  ctx.lineTo(56, -20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#d9e4ff';
  ctx.beginPath();
  ctx.arc(52, -40, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#11151a';
  ctx.beginPath();
  ctx.arc(53, -40, 2.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#242831';
  ctx.lineWidth = 6;
  const step = Math.sin(stride + index) * 12;

  ctx.beginPath();
  ctx.moveTo(-24, -10);
  ctx.lineTo(-36 - step, 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.lineTo(-12 + step, 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(18, -10);
  ctx.lineTo(8 + step, 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(36, -10);
  ctx.lineTo(28 - step, 34);
  ctx.stroke();

  ctx.restore();
}

function drawFireflies(ctx: CanvasRenderingContext2D, fireflies: Firefly[], t: number) {
  ctx.save();
  fireflies.forEach((fly, index) => {
    const wobble = Math.sin(fly.phase + t * (0.6 + index * 0.02));
    const x = fly.x + wobble * 12;
    const y = fly.y + Math.cos(fly.phase + t * 0.4) * 6;
    const pulse = (Math.sin(fly.phase * 2 + t * 3) + 1.6) / 2.6;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, fly.radius * 6);
    gradient.addColorStop(0, `rgba(24, 255, 182, ${0.78 * pulse})`);
    gradient.addColorStop(1, 'rgba(24, 255, 182, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, fly.radius * 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawMotionTrails(ctx: CanvasRenderingContext2D, x: number, y: number, stride: number) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = 'rgba(46, 217, 126, 0.6)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const offset = stride * 0.4 + i * 0.7;
    ctx.beginPath();
    ctx.moveTo(x - 20 - i * 20, y - 18 + Math.sin(offset) * 6);
    ctx.lineTo(x - 80 - i * 30, y + 12 + Math.cos(offset) * 6);
    ctx.stroke();
  }
  ctx.restore();
}

export function RunningScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();
  const wolvesRef = useRef<WolfState[]>(createWolves());
  const firefliesRef = useRef<Firefly[]>(createFireflies());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordTimeoutRef = useRef<number | null>(null);
  const [isRecording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    let animationActive = true;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const { clientWidth } = container;
      const height = (clientWidth / BASE_WIDTH) * BASE_HEIGHT;
      canvas.style.width = '100%';
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(BASE_WIDTH * dpr);
      canvas.height = Math.floor(BASE_HEIGHT * dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    let previous = performance.now();
    let backgroundOffset = 0;
    let canopyOffset = 0;
    let stride = 0;
    let time = 0;

    const render = (now: number) => {
      if (!animationActive) {
        return;
      }

      const delta = Math.min((now - previous) / 1000, 0.045);
      previous = now;
      stride += delta * 12;
      time += delta;
      backgroundOffset += delta * 240;
      canopyOffset += delta * 96;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

      drawBackground(ctx, backgroundOffset, canopyOffset);
      drawGround(ctx, backgroundOffset * 1.2);

      const boyX = BASE_WIDTH * 0.42;
      const boyY = BASE_HEIGHT * 0.76;
      drawMotionTrails(ctx, boyX, boyY, stride);
      drawBoy(ctx, boyX, boyY, stride);

      wolvesRef.current.forEach((wolf, index) => {
        wolf.phase += delta * wolf.strideSpeed;
        const targetX = boyX - 120 - index * 90;
        wolf.x += (targetX - wolf.x) * delta * 2.4;
        wolf.y = BASE_HEIGHT * 0.76 + Math.sin(time * 2 + index) * 6;
        drawWolf(ctx, wolf, stride * 1.1, index);
      });

      drawFireflies(ctx, firefliesRef.current, time);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      animationActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, []);

  const stopRecorder = useCallback(() => {
    if (recordTimeoutRef.current) {
      window.clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const handleRecord = useCallback(() => {
    if (!canvasRef.current || isRecording) {
      return;
    }
    if (typeof MediaRecorder === 'undefined' || !canvasRef.current.captureStream) {
      console.warn('MediaRecorder or canvas.captureStream is not supported in this browser.');
      return;
    }
    setVideoUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });

    const stream = canvasRef.current.captureStream(60);
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setRecording(false);
    };

    recorder.start();
    setRecording(true);

    recordTimeoutRef.current = window.setTimeout(() => {
      stopRecorder();
    }, 7000);
  }, [isRecording, stopRecorder]);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      stopRecorder();
    };
  }, [stopRecorder, videoUrl]);

  return (
    <div className="scene-shell" ref={containerRef}>
      <div className="scene-header">
        <div>
          <div className="scene-title">Jungle Pursuit</div>
          <p className="scene-subtitle">
            A stylized cinematic loop of a determined boy sprinting through a lush jungle
            canopy while a pack of wolves give chase. Layers of parallax greenery and
            fireflies bring the dense wilderness to life.
          </p>
        </div>
        <div className="controls">
          <button
            className="control-button"
            type="button"
            onClick={handleRecord}
            disabled={isRecording}
          >
            {isRecording ? 'Recording…' : 'Record 7s Clip'}
          </button>
          {videoUrl ? (
            <a className="download-link" href={videoUrl} download="jungle-chase.webm">
              Download clip
            </a>
          ) : null}
        </div>
      </div>
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export default RunningScene;
