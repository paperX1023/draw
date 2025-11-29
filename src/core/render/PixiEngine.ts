import { Application, Container, Rectangle } from 'pixi.js';

export class PixiEngine {
  private static _instance: PixiEngine;
  
  // v8 中 app 可能为 null (初始化前)，或者我们只暴露 stage
  public app: Application | null = null;
  public stage: Container | null = null;
  private _isInitialized = false;

  private constructor() {}

  public static getInstance(): PixiEngine {
    if (!this._instance) {
      this._instance = new PixiEngine();
    }
    return this._instance;
  }

  // 异步初始化方法
  public async init(container: HTMLElement) {
    if (this._isInitialized) return;

    this.app = new Application();

    await this.app.init({
      backgroundAlpha: 0, // 透明背景
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      resizeTo: container 
    });

    this.stage = this.app.stage;
    
    // 配置交互
    this.stage.eventMode = 'static';
    this.stage.hitArea = new Rectangle(0, 0, 100000, 100000); // 无限画布准备

    // 挂载 Canvas
    container.appendChild(this.app.canvas);
    this._isInitialized = true;
  }

  public get isReady() {
    return this._isInitialized;
  }

  public destroy() {
    this.app?.destroy({ removeView: true }, { children: true });
    this._isInitialized = false;
  }
}