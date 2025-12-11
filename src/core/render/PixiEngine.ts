import { Application, Container, Rectangle, Point } from "pixi.js";

const VIEWPORT_KEY = 'canvas-viewport-v1';

interface ViewportData {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export class PixiEngine {
  private static _instance: PixiEngine;

  public app: Application | null = null;
  public stage: Container | null = null;

  private _isInitialized = false;

  // 当前缩放和偏移
  private _zoom = 1;
  private _offsetX = 0;
  private _offsetY = 0;

  private constructor() {}

  public static getInstance(): PixiEngine {
    if (!this._instance) {
      this._instance = new PixiEngine();
    }
    return this._instance;
  }

  // 从 localStorage 读取上一次视图
  private loadViewportFromStorage() {
    try {
      const raw = localStorage.getItem(VIEWPORT_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as Partial<ViewportData>;
      if (typeof data.zoom === 'number') this._zoom = data.zoom;
      if (typeof data.offsetX === 'number') this._offsetX = data.offsetX;
      if (typeof data.offsetY === 'number') this._offsetY = data.offsetY;
    } catch {
      // ignore
    }
  }

  // 保存当前视图到 localStorage
  private saveViewportToStorage() {
    const payload: ViewportData = {
      zoom: this._zoom,
      offsetX: this._offsetX,
      offsetY: this._offsetY,
    };
    localStorage.setItem(VIEWPORT_KEY, JSON.stringify(payload));
  }

  public async init(container: HTMLElement) {
    if (this._isInitialized) return;

    this.loadViewportFromStorage();

    this.app = new Application();

    await this.app.init({
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      resizeTo: container,
    });

    this.stage = this.app.stage;
    this.stage.eventMode = "static";
    this.stage.hitArea = new Rectangle(-50000, -50000, 100000, 100000);

    this.stage.scale.x = this._zoom;
    this.stage.scale.y = this._zoom;
    this.stage.position.x = this._offsetX;
    this.stage.position.y = this._offsetY;

    container.appendChild(this.app.canvas);
    this._isInitialized = true;
  }

  public get isReady() {
    return this._isInitialized;
  }

  // 屏幕坐标 -> 画布世界坐标
  public screenToWorld(p: Point): Point {
    if (!this.stage) return p.clone();

    const { scale, position } = this.stage;
    return new Point(
      (p.x - position.x) / scale.x,
      (p.y - position.y) / scale.y
    );
  }

  // 世界坐标 -> 屏幕坐标
  public worldToScreen(world: Point): Point {
    if (!this.stage) return world.clone();

    const { scale, position } = this.stage;
    return new Point(
      world.x * scale.x + position.x,
      world.y * scale.y + position.y
    );
  }

  // 当前缩放
  public get zoom(): number {
    return this.stage?.scale.x ?? 1;
  }

  // 以屏幕坐标为中心缩放
  public setZoomAt(factor: number, screenX: number, screenY: number) {
    if (!this.stage) return;
    const stage = this.stage;

    const screenPoint = new Point(screenX, screenY);
    const worldBefore = this.screenToWorld(screenPoint);

    // 更新缩放
    const nextZoom = Math.min(4, Math.max(0.2, this._zoom * factor));
    if (nextZoom === this._zoom) return;

    this._zoom = nextZoom;
    stage.scale.x = this._zoom;
    stage.scale.y = this._zoom;

    // 调整平移，让缩放围绕鼠标进行
    const newOffsetX = screenPoint.x - worldBefore.x * this._zoom;
    const newOffsetY = screenPoint.y - worldBefore.y * this._zoom;

    stage.position.x = newOffsetX;
    stage.position.y = newOffsetY;

    // 记住偏移值
    this._offsetX = newOffsetX;
    this._offsetY = newOffsetY;
    this.saveViewportToStorage();
  }

  public panBy(dx: number, dy: number) {
    if (!this.stage) return;

    const stage = this.stage;
    const newOffsetX = stage.position.x + dx;
    const newOffsetY = stage.position.y + dy;

    stage.position.x = newOffsetX;
    stage.position.y = newOffsetY;

    this._offsetX = newOffsetX;
    this._offsetY = newOffsetY;
    this.saveViewportToStorage();
  }

  public destroy() {
    this.app?.destroy({ removeView: true }, { children: true });
    this._isInitialized = false;
    this.app = null;
    this.stage = null;
  }
}
