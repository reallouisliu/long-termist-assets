const utils = {
  // 计算资产日均
  calculateDailyAverage(price, purchaseDate) {
    const purchaseTime = new Date(purchaseDate).getTime();
    const now = new Date().getTime();
    const days = Math.ceil((now - purchaseTime) / (1000 * 60 * 60 * 24));
    return price / days;
  },

  // XSS 防护
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // 格式化金额
  formatCurrency(amount) {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount);
  },

  // 格式化日期
  formatDate(date) {
    return new Date(date).toLocaleDateString("zh-CN");
  },
};
