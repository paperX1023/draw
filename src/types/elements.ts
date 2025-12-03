export type ElementType = "rect" | "circle" | "triangle" | "image" | "text";

export interface IElementStyle {
  fillColor: string | null;
  lineColor: string;
  lineWidth: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
}

export interface IFilters {
  blur: number;
  brightness: number;
  contrast: number;
}

export interface IElement {
  readonly id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;

  text?: string;
  imageKey?: string;
  _runtimeURL?: string;
  filters?: IFilters;
  style: IElementStyle;
}
