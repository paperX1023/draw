import { Application, Container, Rectangle, Point } from "pixi.js";

export class PixiEngine {
  private static _instance: PixiEngine;

  public app: Application | null = null;
  public stage: Container | null = null;

  private _isInitialized = false;
  private _zoom = 1; // 当前缩放

  private constructor() {}

  public static getInstance(): PixiEngine {
    if (!this._instance) {
      this._instance = new PixiEngine();
    }
    return this._instance;
  }

  public async init(container: HTMLElement) {
    if (this._isInitialized) return;

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
    // 很大的 hitArea 作为“无限画布”
    this.stage.hitArea = new Rectangle(-50000, -50000, 100000, 100000);

    // 初始缩放 & 平移
    this.stage.scale.set(1);
    this.stage.position.set(0, 0);

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

  // 以屏幕坐标 (screenX, screenY) 为中心缩放
  public setZoomAt(factor: number, screenX: number, screenY: number) {
    if (!this.stage) return;
    const stage = this.stage;

    const screenPoint = new Point(screenX, screenY);
    // 缩放前鼠标对应的世界坐标
    const worldBefore = this.screenToWorld(screenPoint);

    // 更新缩放
    const nextZoom = Math.min(4, Math.max(0.2, this._zoom * factor));
    this._zoom = nextZoom;
    stage.scale.set(this._zoom);

    // 调整平移
    stage.position.set(
      screenPoint.x - worldBefore.x * this._zoom,
      screenPoint.y - worldBefore.y * this._zoom
    );
  }

  // 按指定偏移平移画布
  public panBy(dx: number, dy: number) {
    if (!this.stage) return;
    this.stage.position.x += dx;
    this.stage.position.y += dy;
  }

  public destroy() {
    this.app?.destroy({ removeView: true }, { children: true });
    this._isInitialized = false;
  }
}
