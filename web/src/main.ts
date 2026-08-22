import { randomFill, regionFromBounds } from './actions';
import { FiniteGridEngine } from './engine';
import type { GridEngine } from './engine';
import { DrawingController } from './drawing';
import { Camera, CanvasInputController, CanvasRenderer, RenderSettings } from './rendering';
import { SimulationController, SimulationControlsView } from './simulation';

const DEFAULT_GRID_DIMENSIONS = { width: 100, height: 100 };

function resizeCanvasToViewport(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  camera: Camera,
): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  camera.setViewportSize({ width, height });
}

function createRandomFillButton(engine: GridEngine, camera: Camera): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'simulation-controls__random-fill';
  button.textContent = '🎲';
  button.title = 'Preencher aleatoriamente';
  button.setAttribute('aria-label', 'Preencher aleatoriamente');

  button.addEventListener('click', () => {
    const region = engine.getMode() === 'infinite'
      ? regionFromBounds(camera.getVisibleGridBounds())
      : undefined;
    randomFill(engine, region);
  });

  return button;
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
  const simulation = new SimulationController(engine);

  const inputController = new CanvasInputController(canvas, camera);
  new DrawingController(canvas, camera, engine, inputController, {
    isDrawingAllowed: () => !simulation.isPlaying(),
  });

  const controlsContainer = document.getElementById('simulation-controls');
  if (controlsContainer === null) {
    throw new Error('Elemento #simulation-controls não encontrado');
  }
  new SimulationControlsView(controlsContainer, simulation);

  const randomFillButton = createRandomFillButton(engine, camera);
  controlsContainer.querySelector('.simulation-controls')?.appendChild(randomFillButton);

  resizeCanvasToViewport(canvas, ctx, camera);
  camera.fitToFiniteGrid(DEFAULT_GRID_DIMENSIONS);
  window.addEventListener('resize', () => resizeCanvasToViewport(canvas, ctx, camera));

  const renderFrame = (): void => {
    randomFillButton.disabled = simulation.isPlaying();
    renderer.render(camera, engine);
    window.requestAnimationFrame(renderFrame);
  };
  window.requestAnimationFrame(renderFrame);
}

bootstrap();
