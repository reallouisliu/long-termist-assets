class StorageManager {
  constructor() {
    this.STORAGE_KEY = "asset_tracker_data";
  }

  // 获取所有资产数据
  getAllAssets() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // 保存资产数据
  saveAssets(assets) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(assets));
  }

  // 添加新资产
  addAsset(asset) {
    const assets = this.getAllAssets();
    assets.push({
      ...asset,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    });
    this.saveAssets(assets);
    return assets;
  }

  // 导出数据
  exportData() {
    const data = this.getAllAssets();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset_tracker_backup_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 导入数���
  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      this.saveAssets(data);
      return true;
    } catch (error) {
      console.error("导入数据失败:", error);
      return false;
    }
  }
}

const storage = new StorageManager();
