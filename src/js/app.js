class AssetTracker {
  constructor() {
    this.storage = storage;
    this.initializeUI();
    this.registerServiceWorker();
    this.setupEventListeners();
    this.loadAssets();
  }

  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (error) {
        console.error("Service Worker 注册失败:", error);
      }
    }
  }

  initializeUI() {
    this.statisticsContainer = document.getElementById("statistics");
    this.assetGrid = document.getElementById("assetGrid");
    this.addAssetBtn = document.getElementById("addAsset");
    this.themeToggleBtn = document.getElementById("themeToggle");
    this.exportDataBtn = document.getElementById("exportData");
    this.importDataBtn = document.getElementById("importData");
    this.searchInput = document.querySelector(".search-input");
    this.tabButtons = document.querySelectorAll(".tab-btn");
  }

  setupEventListeners() {
    this.addAssetBtn.addEventListener("click", () => this.showAssetForm());
    this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());
    this.exportDataBtn.addEventListener("click", () =>
      this.storage.exportData()
    );
    this.importDataBtn.addEventListener("click", () => this.showImportDialog());

    // 添加搜索功能
    this.searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const assets = this.storage.getAllAssets();
      const filteredAssets = assets.filter(
        (asset) =>
          asset.name.toLowerCase().includes(searchTerm) ||
          asset.notes?.toLowerCase().includes(searchTerm)
      );
      this.renderAssetGrid(filteredAssets);
    });

    // 添加标签筛选功能
    this.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.tabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const status = btn.textContent;
        const assets = this.storage.getAllAssets();
        let filteredAssets = assets;

        if (status !== "全部") {
          const statusMap = {
            使用中: "inUse",
            已停用: "retired",
            收藏: "collection",
          };
          filteredAssets = assets.filter(
            (asset) => asset.status === statusMap[status]
          );
        }

        this.renderAssetGrid(filteredAssets);
      });
    });
  }

  showAssetForm(asset = null) {
    const form = document.createElement("div");
    form.className = "fixed inset-0 flex items-center justify-center p-4 z-50";
    form.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
      <div class="bg-background rounded-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-md shadow-2xl relative z-10 max-h-[90vh] flex flex-col">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold">${
              asset ? "编辑资产" : "添加资产"
            }</h2>
            <button type="button" class="text-gray-500 hover:text-gray-700" onclick="this.closest('.fixed').remove()">
              ✕
            </button>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span>已选图标：</span>
            <span id="selectedEmoji" class="text-2xl min-w-[2rem] text-center">${
              asset?.icon || "📦"
            }</span>
          </div>
        </div>
        <div class="p-6 overflow-y-auto custom-scrollbar">
          <form id="assetForm" class="space-y-6">
            <div class="space-y-4">
              <div>
                <label class="block mb-2 font-medium">选择图标</label>
                <div class="border rounded-xl divide-y">
                  ${Object.entries(EMOJI_CATEGORIES)
                    .map(
                      ([category, { name, emojis }], index) => `
                      <div class="emoji-category ${index === 0 ? "open" : ""}">
                        <button type="button" 
                          class="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
                          onclick="this.closest('.emoji-category').classList.toggle('open')"
                        >
                          <h3 class="text-sm font-medium text-gray-500">${name}</h3>
                          <span class="transform transition-transform duration-200">▼</span>
                        </button>
                        <div class="grid grid-cols-6 gap-2 p-4 ${
                          index === 0 ? "" : "hidden"
                        }">
                          ${emojis
                            .map(
                              (emoji) => `
                              <label class="aspect-square flex items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center ${
                                asset?.icon === emoji
                                  ? "border-primary bg-primary bg-opacity-10"
                                  : ""
                              }">
                                <input type="radio" name="icon" value="${emoji}" 
                                  class="hidden" ${
                                    asset?.icon === emoji ? "checked" : ""
                                  }>
                                <span class="text-xl">${emoji}</span>
                              </label>
                            `
                            )
                            .join("")}
                        </div>
                      </div>
                    `
                    )
                    .join("")}
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block mb-2 font-medium">资产名称</label>
                  <input type="text" name="name" 
                    class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary" 
                    value="${
                      asset ? utils.escapeHtml(asset.name) : ""
                    }" required>
                </div>
                <div>
                  <label class="block mb-2 font-medium">价格</label>
                  <input type="number" name="price" 
                    class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary" 
                    value="${asset ? asset.price : ""}" required>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block mb-2 font-medium">购买日期</label>
                  <input type="date" name="purchaseDate" 
                    class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary" 
                    value="${asset ? asset.purchaseDate : ""}" required>
                </div>
                <div>
                  <label class="block mb-2 font-medium">服役状态</label>
                  <select name="status" 
                    class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary" required>
                    <option value="inUse" ${
                      asset?.status === "inUse" ? "selected" : ""
                    }>使用中</option>
                    <option value="retired" ${
                      asset?.status === "retired" ? "selected" : ""
                    }>已停用</option>
                    <option value="collection" ${
                      asset?.status === "collection" ? "selected" : ""
                    }>收藏</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block mb-2 font-medium">备注</label>
                <textarea name="notes" 
                  class="w-full p-3 border rounded-lg h-24 resize-none focus:ring-2 focus:ring-primary"
                  >${
                    asset ? utils.escapeHtml(asset.notes || "") : ""
                  }</textarea>
              </div>
            </div>
          </form>
        </div>
        <div class="p-6 border-t">
          <div class="flex justify-end gap-3">
            <button type="button" class="btn" onclick="this.closest('.fixed').remove()">
              取消
            </button>
            <button type="submit" form="assetForm" class="btn-primary">
              保存
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(form);

    // 添加图标选择的点击效果
    form.querySelectorAll('input[name="icon"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        form.querySelectorAll("label").forEach((label) => {
          label.classList.remove(
            "border-primary",
            "bg-primary",
            "bg-opacity-10"
          );
        });
        e.target
          .closest("label")
          .classList.add("border-primary", "bg-primary", "bg-opacity-10");
        // 更新已选图标显示
        const selectedEmoji = form.querySelector("#selectedEmoji");
        selectedEmoji.textContent = e.target.value;
      });
    });

    form.querySelector("#assetForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const assetData = {
        icon: formData.get("icon"),
        name: formData.get("name"),
        price: Number(formData.get("price")),
        purchaseDate: formData.get("purchaseDate"),
        status: formData.get("status"),
        notes: formData.get("notes"),
        id: asset ? asset.id : null,
      };

      if (asset) {
        this.updateAsset(assetData);
      } else {
        this.storage.addAsset(assetData);
      }

      this.loadAssets();
      form.remove();
    });
  }

  loadAssets() {
    const assets = this.storage.getAllAssets();
    this.updateStatistics(assets);
    this.renderAssetGrid(assets);
  }

  updateStatistics(assets) {
    const stats = {
      totalValue: assets.reduce((sum, asset) => sum + asset.price, 0),
      totalCount: assets.length,
      dailyAverage: assets.reduce(
        (sum, asset) =>
          sum + utils.calculateDailyAverage(asset.price, asset.purchaseDate),
        0
      ),
    };

    this.statisticsContainer.innerHTML = `
      <div class="stat-card">
        <div class="flex items-center gap-2 mb-2">
          <span class="emoji-icon">💰</span>
          <h3 class="font-semibold">资产总值</h3>
        </div>
        <p class="text-2xl">${utils.formatCurrency(stats.totalValue)}</p>
      </div>
      <div class="stat-card">
        <div class="flex items-center gap-2 mb-2">
          <span class="emoji-icon">🔢</span>
          <h3 class="font-semibold">总数量</h3>
        </div>
        <p class="text-2xl">${stats.totalCount}</p>
      </div>
      <div class="stat-card">
        <div class="flex items-center gap-2 mb-2">
          <span class="emoji-icon">📅</span>
          <h3 class="font-semibold">日均成本</h3>
        </div>
        <p class="text-2xl">${utils.formatCurrency(stats.dailyAverage)}</p>
      </div>
    `;
  }

  renderAssetGrid(assets) {
    this.assetGrid.innerHTML = assets
      .map(
        (asset) => `
        <div class="asset-card">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${this.getEmojiByIcon(asset.icon)}</span>
              <div>
                <h3 class="font-semibold text-lg">${utils.escapeHtml(
                  asset.name
                )}</h3>
                <p class="text-sm text-gray-500">${this.getStatusBadge(
                  asset.status
                )}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="icon-btn edit-asset" data-asset='${JSON.stringify(
                asset
              )}' title="编辑">
                ✏️
              </button>
              <button class="icon-btn delete-asset" data-id="${
                asset.id
              }" title="删除">
                🗑️
              </button>
            </div>
          </div>
          <div class="mt-4 space-y-2">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-center gap-2">
                <span>💰</span>
                <span>${utils.formatCurrency(asset.price)}</span>
              </div>
              <div class="flex items-center gap-2">
                <span>📅</span>
                <span>${utils.formatDate(asset.purchaseDate)}</span>
              </div>
              <div class="flex items-center gap-2">
                <span>⏱️</span>
                <span>${utils.formatCurrency(
                  utils.calculateDailyAverage(asset.price, asset.purchaseDate)
                )}/天</span>
              </div>
            </div>
            ${
              asset.notes
                ? `<p class="text-gray-600 mt-2 border-t pt-2">${utils.escapeHtml(
                    asset.notes
                  )}</p>`
                : ""
            }
          </div>
        </div>
      `
      )
      .join("");

    // 添加编辑按钮事件监听
    this.assetGrid.querySelectorAll(".edit-asset").forEach((btn) => {
      btn.addEventListener("click", () => {
        const asset = JSON.parse(btn.dataset.asset);
        this.showAssetForm(asset);
      });
    });

    // 添加删除按钮事件监听
    this.assetGrid.querySelectorAll(".delete-asset").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.deleteAsset(btn.dataset.id);
      });
    });
  }

  deleteAsset(id) {
    if (confirm("确认删除该资产？")) {
      const assets = this.storage
        .getAllAssets()
        .filter((asset) => asset.id !== id);
      this.storage.saveAssets(assets);
      this.loadAssets();
    }
  }

  updateAsset(assetData) {
    const assets = this.storage.getAllAssets();
    const index = assets.findIndex((a) => a.id === assetData.id);
    if (index !== -1) {
      assets[index] = { ...assets[index], ...assetData };
      this.storage.saveAssets(assets);
    }
  }

  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  }

  showImportDialog() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const success = await this.storage.importData(file);
        if (success) {
          this.loadAssets();
          alert("数据导入成功");
        } else {
          alert("数据导入失败");
        }
      }
    };
    input.click();
  }

  getStatusBadge(status) {
    const statusConfig = {
      inUse: { emoji: "✅", text: "使用中" },
      retired: { emoji: "⏸️", text: "已停用" },
      collection: { emoji: "⭐️", text: "收藏" },
    };
    const config = statusConfig[status] || { emoji: "❓", text: status };
    return `<span class="flex items-center gap-1">
      <span>${config.emoji}</span>
      <span>${config.text}</span>
    </span>`;
  }

  getEmojiByIcon(icon) {
    return icon || "📦";
  }
}

// 初始化应用
const app = new AssetTracker();

// 设置初始主题
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("theme") || "light"
);
