import { FiniteGridEngine } from './engine';
import { Camera, CanvasInputController, CanvasRenderer, RenderSettings } from './rendering';

const DEFAULT_GRID_DIMENSIONS = { width: 100, height: 100 };

function resizeCanvasToViewport(canvas: HTMLCanvasElement, camera: Camera): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  camera.setViewportSize({ width: canvas.width, height: canvas.height });
}

function bootstrap(): void {
  const canvas = document.getElementById('game-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Elemento canvas #game-canvas não encontrado');
  }

  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    throw new Error('Contexto 2D não disponível neste navegador');
  }

  const engine = new FiniteGridEngine(DEFAULT_GRID_DIMENSIONS);
  const camera = new Camera({ width: canvas.clientWidth, height: canvas.clientHeight });
  const settings = new RenderSettings();
  const renderer = new CanvasRenderer(ctx, settings);

  new CanvasInputController(canvas, camera);

  resizeCanvasToViewport(canvas, camera);
  camera.fitToFiniteGrid(DEFAULT_GRID_DIMENSIONS);
  window.addEventListener('resize', () => resizeCanvasToViewport(canvas, camera));

  const renderFrame = (): void => {
    renderer.render(camera, engine);
    window.requestAnimationFrame(renderFrame);
  };
  window.requestAnimationFrame(renderFrame);
}

bootstrap();
