import type { FederatedPointerEvent } from 'pixi.js';

export interface ITool {
    name: string;
    onActivate(): void;
    onDeactivate(): void;
    onPointerDown?(event: FederatedPointerEvent): void;
    onPointerMove?(event: FederatedPointerEvent): void;
    onPointerUp?(event: FederatedPointerEvent): void;
}