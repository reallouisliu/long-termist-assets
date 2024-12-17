// Constants
const STORAGE_KEY = "long-termist-assets";
const SETTINGS_KEY = "long-termist-settings";

// Settings management
class Settings {
  constructor() {
    this.settings = this.loadSettings();
  }

  loadSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          theme: "light",
          language: "zh",
        };
  }

  saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    this.applySettings();
  }

  applySettings() {
    document.documentElement.setAttribute("data-theme", this.settings.theme);
    document.documentElement.setAttribute("lang", this.settings.language);
    this.updateUI();
  }

  updateUI() {
    const texts = config.i18n[this.settings.language];
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (texts[key]) {
        element.textContent = texts[key];
      }
    });
  }

  toggleTheme() {
    this.settings.theme = this.settings.theme === "light" ? "dark" : "light";
    this.saveSettings();
  }

  toggleLanguage() {
    this.settings.language = this.settings.language === "zh" ? "en" : "zh";
    this.saveSettings();
  }
}

// Asset management
class AssetStore {
  constructor() {
    this.assets = this.loadAssets();
    this.settings = new Settings();
  }

  loadAssets() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const assets = stored ? JSON.parse(stored) : [];

    // 为所有资产计算持有天数
    return assets.map((asset) => ({
      ...asset,
      holdingDays: this.calculateHoldingDays(asset.purchaseDate),
    }));
  }

  saveAssets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.assets));
    this.updateUI();
  }

  calculateDailyAverage(price, purchaseDate) {
    const days = Math.max(
      1,
      Math.floor((new Date() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24))
    );
    return price / days;
  }

  calculateHoldingDays(purchaseDate) {
    return Math.floor(
      (new Date() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24)
    );
  }

  addAsset(asset) {
    asset.name = DOMPurify.sanitize(asset.name);
    asset.notes = DOMPurify.sanitize(asset.notes);
    asset.icon = DOMPurify.sanitize(asset.icon);

    const holdingDays = this.calculateHoldingDays(asset.purchaseDate);

    this.assets.push({
      ...asset,
      id: Date.now(),
      dailyAverage: this.calculateDailyAverage(asset.price, asset.purchaseDate),
      holdingDays: holdingDays,
    });
    this.saveAssets();
  }

  updateAsset(id, asset) {
    const index = this.assets.findIndex((a) => a.id === id);
    if (index !== -1) {
      const holdingDays = this.calculateHoldingDays(asset.purchaseDate);

      this.assets[index] = {
        ...asset,
        dailyAverage: this.calculateDailyAverage(
          asset.price,
          asset.purchaseDate
        ),
        holdingDays: holdingDays,
      };
      this.saveAssets();
    }
  }

  deleteAsset(id) {
    this.assets = this.assets.filter((a) => a.id !== id);
    this.saveAssets();
  }

  getFilteredAssets(filter = "all") {
    switch (filter) {
      case "active":
        return this.assets.filter((a) => a.isActive);
      case "retired":
        return this.assets.filter((a) => !a.isActive);
      case "collection":
        return this.assets.filter((a) => a.isCollection);
      default:
        return this.assets;
    }
  }

  getStatistics() {
    const total = this.assets.reduce((sum, asset) => sum + asset.price, 0);
    const count = this.assets.length;
    const totalDaily = this.assets.reduce(
      (sum, asset) => sum + asset.dailyAverage,
      0
    );

    return {
      total,
      count,
      totalDaily,
    };
  }

  exportData() {
    const dataStr = JSON.stringify(this.assets);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "assets.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }

  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        this.assets = data;
        this.saveAssets();
        return true;
      }
    } catch (error) {
      console.error("Import failed:", error);
      return false;
    }
  }

  updateUI() {
    const stats = this.getStatistics();
    document.getElementById(
      "total-assets"
    ).textContent = `¥${stats.total.toFixed(2)}`;
    document.getElementById("total-count").textContent = stats.count;
    document.getElementById(
      "total-daily"
    ).textContent = `¥${stats.totalDaily.toFixed(2)}/天`;

    const container = document.getElementById("assets-container");
    const isCardView = document
      .getElementById("card-view")
      .classList.contains("active");
    const currentFilter =
      document.querySelector(".filter-btn.active").dataset.filter;
    const filteredAssets = this.getFilteredAssets(currentFilter);

    container.innerHTML = "";
    filteredAssets.forEach((asset) => {
      const element = document.createElement("div");
      element.className = isCardView ? "asset-card" : "asset-list-item";
      element.innerHTML = this.renderAsset(asset, isCardView);
      container.appendChild(element);
    });
  }

  renderAsset(asset, isCardView) {
    if (isCardView) {
      return `
                <div class="flex items-center justify-between mb-2">
                    <span class="text-2xl">${asset.icon}</span>
                    <div class="action-buttons flex gap-2">
                        <button onclick="assetStore.editAsset(${
                          asset.id
                        })" class="btn-secondary">
                            <span class="hidden md:inline">编辑</span>
                            <span class="md:hidden">✏️</span>
                        </button>
                        <button onclick="assetStore.deleteAsset(${
                          asset.id
                        })" class="btn-secondary">
                            <span class="hidden md:inline">删除</span>
                            <span class="md:hidden">🗑️</span>
                        </button>
                    </div>
                </div>
                <h3 class="text-lg font-semibold">${asset.name}</h3>
                <p class="text-gray-600">¥${asset.price.toFixed(2)}</p>
                <p class="text-gray-600">¥${asset.dailyAverage.toFixed(
                  2
                )}/天</p>
                <p class="text-gray-600">已持有 ${asset.holdingDays} 天</p>
                <p class="text-sm text-gray-500">${asset.notes}</p>
            `;
    } else {
      return `
                <div class="flex items-center gap-4">
                    <span class="text-xl">${asset.icon}</span>
                    <div>
                        <h3 class="font-semibold">${asset.name}</h3>
                        <p class="text-sm text-gray-600">¥${asset.price.toFixed(
                          2
                        )} | ¥${asset.dailyAverage.toFixed(2)}/天 | ${
        asset.holdingDays
      }天</p>
                    </div>
                </div>
            `;
    }
  }

  editAsset(id) {
    const asset = this.assets.find((a) => a.id === id);
    if (asset) {
      const form = document.getElementById("asset-form");
      form.setAttribute("data-edit-id", id);
      document.getElementById("asset-icon").value = asset.icon;
      document.getElementById("asset-name").value = asset.name;
      document.getElementById("asset-price").value = asset.price;
      document.getElementById("purchase-date").value = asset.purchaseDate;
      document.getElementById("is-active").checked = asset.isActive;
      document.getElementById("is-collection").checked = asset.isCollection;
      document.getElementById("asset-notes").value = asset.notes || "";
      document.getElementById("asset-modal").classList.remove("hidden");
    }
  }
}

// Initialize
const assetStore = new AssetStore();

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Icon picker
  const iconInput = document.getElementById("asset-icon");
  document.querySelectorAll(".icon-option").forEach((option) => {
    option.addEventListener("click", function () {
      const icon = this.getAttribute("data-icon");
      iconInput.value = icon;
      document
        .querySelectorAll(".icon-option")
        .forEach((opt) => opt.classList.remove("selected"));
      this.classList.add("selected");
    });
  });

  // Theme toggle
  document.getElementById("theme-toggle").addEventListener("click", () => {
    assetStore.settings.toggleTheme();
  });

  // Language toggle
  document.getElementById("language-toggle").addEventListener("click", () => {
    assetStore.settings.toggleLanguage();
  });

  // Add asset button
  document.getElementById("add-asset").addEventListener("click", () => {
    document.getElementById("asset-form").removeAttribute("data-edit-id");
    document.getElementById("asset-form").reset();
    document
      .querySelectorAll(".icon-option")
      .forEach((opt) => opt.classList.remove("selected"));
    document.getElementById("asset-modal").classList.remove("hidden");
  });

  // Close modal
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("asset-modal").classList.add("hidden");
  });

  // Asset form submission
  document.getElementById("asset-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const asset = {
      icon: formData.get("asset-icon"),
      name: formData.get("asset-name"),
      price: parseFloat(formData.get("asset-price")),
      purchaseDate: formData.get("purchase-date"),
      isActive: formData.get("is-active") === "on",
      isCollection: formData.get("is-collection") === "on",
      notes: formData.get("asset-notes"),
    };

    const editId = e.target.getAttribute("data-edit-id");
    if (editId) {
      assetStore.updateAsset(parseInt(editId), asset);
    } else {
      assetStore.addAsset(asset);
    }

    document.getElementById("asset-modal").classList.add("hidden");
  });

  // Import/Export
  document.getElementById("import-data").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });

  document
    .getElementById("import-file")
    .addEventListener("change", async (e) => {
      if (e.target.files.length > 0) {
        await assetStore.importData(e.target.files[0]);
        e.target.value = "";
      }
    });

  document.getElementById("export-data").addEventListener("click", () => {
    assetStore.exportData();
  });

  // View toggle
  document.getElementById("card-view").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("list-view").classList.remove("active");
    assetStore.updateUI();
  });

  document.getElementById("list-view").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("card-view").classList.remove("active");
    assetStore.updateUI();
  });

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      assetStore.updateUI();
    });
  });

  // Initialize UI
  assetStore.settings.applySettings();
  assetStore.updateUI();

  // Close modal when clicking outside
  document.getElementById("asset-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById("asset-modal").classList.add("hidden");
    }
  });

  // 移动端菜单控制
  const mobileMenuTrigger = document.getElementById("mobile-menu-trigger");
  const settingsPanel = document.querySelector(".settings-panel");

  // 切换菜单显示状态
  const toggleMenu = (e) => {
    e?.stopPropagation();
    settingsPanel.classList.toggle("show");
  };

  // 关闭菜单
  const closeMenu = () => {
    settingsPanel.classList.remove("show");
  };

  // 点击触发按钮
  mobileMenuTrigger.addEventListener("click", toggleMenu);

  // 点击外部区域关闭菜单
  document.addEventListener("click", (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== mobileMenuTrigger) {
      closeMenu();
    }
  });

  // 阻止菜单内部点击事件冒泡
  settingsPanel.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // 点击菜单项后关闭菜单
  settingsPanel.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        setTimeout(closeMenu, 100);
      }
    });
  });
});

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("ServiceWorker registration successful");
      })
      .catch((err) => {
        console.log("ServiceWorker registration failed: ", err);
      });
  });
}
