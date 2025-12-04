import localforage from "localforage";

const assetStore = localforage.createInstance({
  name: "PixiEditor",
  storeName: "assets",
});

type RuntimeEntry = {
  url: string;
  blob: Blob;
  refCount: number;
};

// 已完成的缓存
const runtimeCache = new Map<string, RuntimeEntry>();

// 进行中的加载任务
const loadingMap = new Map<string, Promise<RuntimeEntry>>();

export const AssetManager = {
  async saveImage(file: File | Blob): Promise<string> {
    const imageKey = `img_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    await assetStore.setItem(imageKey, file);
    return imageKey;
  },

  async getRuntimeURL(imageKey: string): Promise<string | null> {
    // 已缓存
    const cached = runtimeCache.get(imageKey);
    if (cached) {
      cached.refCount++;
      return cached.url;
    }

    // 已经在加载时复用同一个 Promise
    const inflight = loadingMap.get(imageKey);
    if (inflight) {
      const entry = await inflight;
      entry.refCount++;
      return entry.url;
    }

    // 第一次发起加载
    const loadPromise: Promise<RuntimeEntry> = (async () => {
      const blob = await assetStore.getItem<Blob>(imageKey);
      if (!blob) {
        // 加载失败从 loadingMap 清掉
        throw new Error(`Asset not found for key: ${imageKey}`);
      }
      const url = URL.createObjectURL(blob);
      const entry: RuntimeEntry = { url, blob, refCount: 0 };
      runtimeCache.set(imageKey, entry);
      return entry;
    })();

    // 放进 loadingMap，后面的请求复用
    loadingMap.set(imageKey, loadPromise);

    try {
      const entry = await loadPromise;
      entry.refCount++;
      return entry.url;
    } catch (e) {
      runtimeCache.delete(imageKey);
      throw e;
    } finally {
      loadingMap.delete(imageKey);
    }
  },

  releaseRuntimeURL(imageKey: string) {
    const cached = runtimeCache.get(imageKey);
    if (!cached) return;

    cached.refCount--;
    if (cached.refCount <= 0) {
      URL.revokeObjectURL(cached.url);
      runtimeCache.delete(imageKey);
    }
  },

  async deleteImage(imageKey: string) {
    const cached = runtimeCache.get(imageKey);
    if (cached) {
      URL.revokeObjectURL(cached.url);
      runtimeCache.delete(imageKey);
    }

    loadingMap.delete(imageKey);

    await assetStore.removeItem(imageKey);
  },
};
