import {
  Container,
  Graphics,
  Text,
  Sprite,
  Texture,
  BlurFilter,
  ColorMatrixFilter,
} from "pixi.js";
import type { IElement } from "@/types/elements";

// 几何绘制
const drawShapeGeometry = (g: Graphics, elementData: IElement) => {
  const { type, width, height } = elementData;
  const style = elementData.style || {};
  const lineWidth =
    style.lineWidth !== undefined ? style.lineWidth : 2;
  const lineColor =
    style.lineColor !== undefined ? style.lineColor : 0x000000;
  const fillColor = style.fillColor;

  g.clear();

  switch (type) {
    case "rect":
      g.rect(0, 0, width, height);
      break;
    case "circle":
      g.ellipse(width / 2, height / 2, width / 2, height / 2);
      break;
    case "triangle":
      g.poly([width / 2, 0, 0, height, width, height]);
      break;
  }

  if (fillColor !== null && fillColor !== undefined) {
    g.fill({ color: fillColor as any });
  } else {
    g.fill({ color: 0xffffff, alpha: 0.001 });
  }

  if (lineWidth > 0) {
    g.stroke({ width: lineWidth, color: lineColor as any });
  }
};

// 图形文字
const updateShapeLabel = (container: Container, elementData: IElement) => {
  const label = container.getChildByLabel("label") as Text | undefined;
  if (!label) return;

  if (!elementData.text) {
    label.visible = false;
    return;
  }

  const style = elementData.style || {};
  label.visible = true;
  label.text = elementData.text;
  label.style.fontFamily = style.fontFamily || "Arial";
  label.style.fontSize = style.fontSize || 14;
  label.style.fill = style.fontColor || 0x000000;

  label.x = elementData.width / 2;
  label.y = elementData.height / 2;
};

// 滤镜
const applyFilters = (displayObject: Container, filterData: any) => {
  if (!filterData) {
    displayObject.filters = [];
    return;
  }
  const filtersToApply = [];
  if (filterData.blur > 0) {
    filtersToApply.push(new BlurFilter({ strength: filterData.blur }));
  }
  if (filterData.brightness !== 1 || filterData.contrast !== 1) {
    const colorMatrix = new ColorMatrixFilter();
    colorMatrix.brightness(filterData.brightness, false);
    colorMatrix.contrast(filterData.contrast, false);
    filtersToApply.push(colorMatrix);
  }
  displayObject.filters = filtersToApply;
};

// 纹理缓存
const runtimeTextureCache = new Map<string, Texture>();

async function loadTextureForUrl(url: string): Promise<Texture> {
  const cached = runtimeTextureCache.get(url);
  if (cached) return cached;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
  });
  const tex = Texture.from(img);
  runtimeTextureCache.set(url, tex);
  return tex;
}

// 核心
export const updateOrCreateShape = (
  elementData: IElement,
  existingObject?: Container
): Container | null => {
  let displayObject = existingObject;

  if (!displayObject) {
    if (elementData.type === "image") {
      displayObject = new Container();

      const hitArea = new Graphics();
      hitArea.label = "hitArea";
      displayObject.addChild(hitArea);
    } else if (elementData.type === "text") {
      displayObject = new Container();

      const textNode = new Text({
        text: elementData.text || "双击编辑",
        style: {
          fontSize: elementData.style.fontSize || 24,
          fontFamily: elementData.style.fontFamily || "Arial",
          fill: elementData.style.fontColor || 0x000000,
          align: "center",
        },
      });
      textNode.label = "text";
      textNode.anchor.set(0.5);
      displayObject.addChild(textNode);
    } else {
      displayObject = new Container();

      const shape = new Graphics();
      shape.label = "shape";
      displayObject.addChild(shape);

      const label = new Text({
        text: "",
        style: { align: "center" },
      });
      label.label = "label";
      label.anchor.set(0.5);
      displayObject.addChild(label);
    }

    displayObject.eventMode = "static";
    displayObject.cursor = "pointer";
  }

  // 更新
  if (elementData.type === "image" && displayObject instanceof Container) {
    // 图片元素
    let hitArea = displayObject.getChildByLabel("hitArea") as Graphics;
    if (!hitArea) {
      hitArea = new Graphics();
      hitArea.label = "hitArea";
      displayObject.addChildAt(hitArea, 0);
    }
    hitArea.clear();
    hitArea.rect(0, 0, elementData.width, elementData.height);
    hitArea.fill({ color: 0xffffff, alpha: 0.0001 });

    let sprite = displayObject.getChildByLabel("imageContent") as
      | Sprite
      | undefined;
    const url = elementData._runtimeURL;

    if (url) {
      if (!sprite) {
        sprite = new Sprite(Texture.EMPTY);
        sprite.label = "imageContent";
        displayObject.addChild(sprite);
      }

      sprite.visible = false;

      loadTextureForUrl(url)
        .then((tex) => {
          if (!sprite || sprite.destroyed) return;
          sprite.texture = tex;
          sprite.width = elementData.width;
          sprite.height = elementData.height;
          sprite.visible = true;
        })
        .catch((err) => {
          console.warn("加载图片纹理失败:", url, err);
        });
    } else {
      if (sprite) sprite.visible = false;
    }

    displayObject.width = elementData.width;
    displayObject.height = elementData.height;
    applyFilters(displayObject, elementData.filters);
  } else if (elementData.type === "text") {
    // 纯文本元素
    const textNode = displayObject.getChildByLabel("text") as Text;
    const style = elementData.style || {};

    textNode.text = elementData.text || "双击编辑";
    textNode.style.fontSize = style.fontSize || 24;
    textNode.style.fontFamily = style.fontFamily || "Arial";
    textNode.style.fill = style.fontColor || 0x000000;

    textNode.x = elementData.width / 2;
    textNode.y = elementData.height / 2;
  } else {
    // 几何图形元素
    const shape = displayObject.getChildByLabel("shape") as Graphics;
    drawShapeGeometry(shape, elementData);
    updateShapeLabel(displayObject, elementData);
  }

  // 变换
  displayObject.x = elementData.x;
  displayObject.y = elementData.y;
  displayObject.rotation = elementData.rotation || 0;
  displayObject.pivot.set(0, 0);

  return displayObject;
};