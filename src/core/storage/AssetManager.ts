import localforage from "localforage";

// 配置数据库
const assetStore = localforage.createInstance({
    name: "PixiEditor",
    storeName: "assets",
})

export const AssetManager = {
    // 保存图片并返回其唯一键
    async saveImage(file: File | Blob): Promise<string> {
        const imageKey = `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await assetStore.setItem(imageKey, file);
        return imageKey;
    },

    // 获取图片的URL
    async getImageUrl(imageKey: string): Promise<string | null> {
        const blob = await assetStore.getItem<Blob>(imageKey);
        if (!blob) return null;
        return URL.createObjectURL(blob);
    },

    // 删除图片
    async deleteImage(imageKey: string) {
        await assetStore.removeItem(imageKey);
    }
}