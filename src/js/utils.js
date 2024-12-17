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

  // 计算已购买天数
  calculateDaysOwned(purchaseDate) {
    const purchaseTime = new Date(purchaseDate).getTime();
    const now = new Date().getTime();
    return Math.ceil((now - purchaseTime) / (1000 * 60 * 60 * 24));
  },

  // 格式化已购买天数
  formatDaysOwned(days) {
    if (days < 30) {
      return `${days} 天`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return remainingDays > 0
        ? `${months} 个月 ${remainingDays} 天`
        : `${months} 个月`;
    } else {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      const months = Math.floor(remainingDays / 30);
      return months > 0 ? `${years} 年 ${months} 个月` : `${years} 年`;
    }
  },
};
