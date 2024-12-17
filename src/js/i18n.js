const i18n = {
  zh: {
    title: "资产统计",
    addAsset: "添加资产",
    editAsset: "编辑资产",
    deleteAsset: "删除资产",
    assetName: "资产名称",
    assetPrice: "价格",
    purchaseDate: "购买日期",
    status: "状态",
    notes: "备注",
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    totalAssets: "资产总值",
    totalCount: "总数量",
    dailyAverage: "日均成本",
    inUse: "使用中",
    retired: "已停用",
    collection: "收藏",
  },
  en: {
    // 英文翻译...
  },
};

const i18nManager = {
  currentLang: "zh",

  t(key) {
    return i18n[this.currentLang][key] || key;
  },

  setLang(lang) {
    if (i18n[lang]) {
      this.currentLang = lang;
      this.updateUI();
    }
  },

  updateUI() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = this.t(key);
    });
  },
};
