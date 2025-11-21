// src/composables/useRenderer.js
import * as PIXI from 'pixi.js';

let appInstance = null;
let stageInstance = null;
let cleanupHandler = null;

export function useRenderer() {

    const initRenderer = (mountElement) => {
        if (appInstance) return;

        // 1. 创建应用
        appInstance = new PIXI.Application({
            width: mountElement.clientWidth,
            height: mountElement.clientHeight,
            backgroundColor: 0xf5f5f5, // 浅灰背景
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
        });

        // 2. 挂载
        mountElement.appendChild(appInstance.view);
        stageInstance = appInstance.stage;

        // 3. 【关键修复】设置全屏交互区域，否则点击空白处无效
        stageInstance.eventMode = 'static';
        stageInstance.hitArea = new PIXI.Rectangle(0, 0, mountElement.clientWidth, mountElement.clientHeight);

        // 4. Resize 监听
        const resizeCanvas = () => {
            const w = mountElement.clientWidth;
            const h = mountElement.clientHeight;
            appInstance.renderer.resize(w, h);
            // 更新交互区域
            stageInstance.hitArea = new PIXI.Rectangle(0, 0, w, h);
        };

        window.addEventListener('resize', resizeCanvas);

        cleanupHandler = () => {
            window.removeEventListener('resize', resizeCanvas);
            appInstance.destroy(true);
            appInstance = null;
            stageInstance = null;
        };
    };

    const getStage = () => stageInstance;
    const getApp = () => appInstance;

    return { initRenderer, getStage, getApp, cleanupHandler };
}