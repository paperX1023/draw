import localforage from "localforage";

const assetStore = localforage.createInstance({
    name: "PixiEditor",
    storeName: "assets"
});

// 运行时缓存
const runtimeCache = new Map<
    string,
    { url: string; blob: Blob; refCount: number }
>();

export const AssetManager = {
    async saveImage(file: File | Blob): Promise<string> {
        const imageKey = `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await assetStore.setItem(imageKey, file);
        return imageKey;
    },

    async getRuntimeURL(imageKey: string): Promise<string | null> {
        // 检查 runtime 缓存
        const cached = runtimeCache.get(imageKey);
        if (cached) {
            cached.refCount++;
            return cached.url;
        }

        // 读取 Blob
        const blob = await assetStore.getItem<Blob>(imageKey);
        if (!blob) return null;

        // 创建唯一 blob URL 并入缓存
        const url = URL.createObjectURL(blob);

        runtimeCache.set(imageKey, {
            url,
            blob,
            refCount: 1
        });

        return url;
    },

    // 当 refCount==0 时释放 URL
    releaseRuntimeURL(imageKey: string) {
        const cached = runtimeCache.get(imageKey);
        if (!cached) return;

        cached.refCount--;

        if (cached.refCount <= 0) {
            URL.revokeObjectURL(cached.url);
            runtimeCache.delete(imageKey);
        }
    },

    // 删除图片
    async deleteImage(imageKey: string) {
        // 清理 runtime
        const cached = runtimeCache.get(imageKey);
        if (cached) {
            URL.revokeObjectURL(cached.url);
            runtimeCache.delete(imageKey);
        }
        // 清理 IndexedDB
        await assetStore.removeItem(imageKey);
    }
};
