import './style.css';
import { Game } from './game/Game';

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-root');

if (!(canvas instanceof HTMLCanvasElement) || !(uiRoot instanceof HTMLElement)) {
  throw new Error('Hiányzó DOM elemek a játék indításához');
}

const game = new Game(canvas, uiRoot);
game.start();
