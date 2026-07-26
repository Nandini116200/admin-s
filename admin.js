const ADMIN_STATUS_OPTIONS = [
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

const ADMIN_RESEND_SECONDS = 10;
const ADMIN_TARGET_STORAGE_KEY = "jfamDailyRevenueTarget";
const ADMIN_DEFAULT_DAILY_REVENUE_GOAL = 45000;
const ADMIN_PRODUCT_CATALOGUE = [
  "Raw Buffalo Milk",
  "Raw Cow Milk",
  "Raw A2 Cow Milk",
  "Buffalo Bilona Chaach",
  "Cow Bilona Chaach",
  "Buffalo Ghee",
  "Cow Ghee",
  "Raw A2 Cow Ghee",
  "Dahi",
  "Paneer"
];

const adminState = {
  orders: [],
  products: [],
  highlightedOrderId: "",
  clickedStatusOrderId: "",
  soundEnabled: false,
  channel: null,
  resendTimer: null,
  authChecked: false
};

const adminEls = {
  loginPanel: document.getElementById("adminLoginPanel"),
  dashboard: document.getElementById("adminDashboard"),
  greetingTitle: document.getElementById("adminGreetingTitle"),
  loginTitle: document.getElementById("adminLoginTitle"),
  loginCopy: document.getElementById("adminLoginCopy"),
  loginForm: document.getElementById("adminLoginForm"),
  otpForm: document.getElementById("adminOtpForm"),
  email: document.getElementById("adminEmailInput"),
  otp: document.getElementById("adminOtpInput"),
  otpDigits: [...document.querySelectorAll(".otp-digit")],
  otpEmail: document.getElementById("adminOtpEmail"),
  resendOtp: document.getElementById("adminResendOtpBtn"),
  resendTimer: document.getElementById("adminResendTimer"),
  loginStatus: document.getElementById("adminLoginStatus"),
  sidebarToggle: document.getElementById("sidebarToggleBtn"),
  refresh: document.getElementById("refreshOrdersBtn"),
  search: document.getElementById("orderSearchInput"),
  statusFilter: document.getElementById("orderStatusFilter"),
  list: document.getElementById("ordersList"),
  total: document.getElementById("totalOrdersStat"),
  confirmed: document.getElementById("confirmedOrdersStat"),
  today: document.getElementById("todayOrdersStat"),
  revenue: document.getElementById("revenueStat"),
  confirmedDetail: document.getElementById("confirmedOrdersDetail"),
  deliveredDetail: document.getElementById("deliveredOrdersDetail"),
  revenueDeliveredDetail: document.getElementById("revenueDeliveredDetail"),
  newSubscribersDetail: document.getElementById("newSubscribersDetail"),
  confirmedTrend: document.getElementById("confirmedOrdersTrend"),
  deliveredTrend: document.getElementById("deliveredOrdersTrend"),
  revenueDeliveredTrend: document.getElementById("revenueDeliveredTrend"),
  newSubscribersTrend: document.getElementById("newSubscribersTrend"),
  targetPanel: document.querySelector(".revenue-target-panel"),
  targetRevenueValue: document.getElementById("targetRevenueValue"),
  targetRevenueInput: document.getElementById("targetRevenueInput"),
  targetProgressSummary: document.getElementById("targetProgressSummary"),
  targetOnTimeRate: document.getElementById("targetOnTimeRate"),
  targetAvgOrder: document.getElementById("targetAvgOrder"),
  targetActiveSubs: document.getElementById("targetActiveSubs"),
  targetPendingDrops: document.getElementById("targetPendingDrops"),
  exploreConfirmed: document.getElementById("exploreConfirmedValue"),
  exploreDelivered: document.getElementById("exploreDeliveredValue"),
  exploreRevenue: document.getElementById("exploreRevenueValue"),
  exploreKpi: document.getElementById("exploreKpiValue"),
  exploreSubscriptions: document.getElementById("exploreSubscriptionsValue"),
  exploreDelivery: document.getElementById("exploreDeliveryValue"),
  exploreCustomers: document.getElementById("exploreCustomersValue"),
  exploreProducts: document.getElementById("exploreProductsValue"),
  toast: document.getElementById("adminToast")
};

const ADMIN_LUMI_ICONS = {
  menu: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  dashboard: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z"/></svg>',
  kpi: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7M4 19h16"/></svg>',
  kpis: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7M4 19h16"/></svg>',
  confirmed: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 6"/><path d="M4 20h16"/></svg>',
  delivered: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v10H3zM14 11h4l3 3v3h-7z"/><path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
  revenue: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10M7 9h10M9 5c4 0 6 2 6 5s-2 5-6 5l6 4"/></svg>',
  subscriptions: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3"/><path d="M4 11V8a2 2 0 0 1 2-2h14"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v3a2 2 0 0 1-2 2H4"/></svg>',
  delivery: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10v9H4zM14 10h4l3 3v3h-7z"/><path d="M8 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
  customers: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0"/><path d="M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-5-6"/></svg>',
  products: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
  database: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></svg>',
  more: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  trendUp: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l5-5 4 4 7-7"/><path d="M15 8h5v5"/></svg>',
  clock: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
  refresh: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-11.7-3.1L4 8"/><path d="M6 15a7 7 0 0 0 11.7 3.1L20 16"/></svg>'
};

const ADMIN_NAV_ITEMS = [
  { key: "dashboard", href: "index.html", label: "Dashboard", group: "Overview" },
  { key: "kpis", href: "Kpis.html", label: "KPIs", group: "Overview" },
  { key: "confirmed", href: "Confirmed.html", label: "Orders Confirmed", group: "Today" },
  { key: "delivered", href: "Orders.html", label: "Orders Delivered", group: "Today" },
  { key: "revenue", href: "Revenue.html", label: "Revenue", group: "Today" },
  { key: "subscriptions", href: "Subscriptions.html", label: "Subscriptions", group: "Manage" },
  { key: "delivery", href: "Delivery.html", label: "Delivery Partners", group: "Manage" },
  { key: "customers", href: "Customers.html", label: "Customers", group: "Manage" },
  { key: "products", href: "Products.html", label: "Products", group: "Manage" },
  { key: "database", href: "Database.html", label: "Tables", group: "Manage" }
];

function adminSetupMobileMore() {
  const bottomNav = document.querySelector(".bottom-nav");
  if (!bottomNav || document.getElementById("mobileMoreBtn")) return;

  bottomNav.insertAdjacentHTML("beforeend", `
    <button type="button" class="bottom-more-btn" id="mobileMoreBtn" aria-expanded="false" aria-controls="mobileMorePanel">
      <span data-more-icon aria-hidden="true"></span>
      More
    </button>
    <div class="mobile-more-backdrop" id="mobileMoreBackdrop" hidden></div>
    <section class="mobile-more-panel" id="mobileMorePanel" aria-label="All admin pages" hidden>
      <div class="mobile-more-head">
        <strong>All pages</strong>
        <button type="button" id="mobileMoreClose" aria-label="Close menu">Close</button>
      </div>
      <nav class="mobile-more-grid">
        ${ADMIN_NAV_ITEMS.map(item => `
          <a href="${item.href}" data-nav-key="${item.key}">
            <span></span>
            <small>${item.group}</small>
            <b>${item.label}</b>
          </a>
        `).join("")}
      </nav>
    </section>
  `);

  const button = document.getElementById("mobileMoreBtn");
  const panel = document.getElementById("mobileMorePanel");
  const backdrop = document.getElementById("mobileMoreBackdrop");
  const close = document.getElementById("mobileMoreClose");
  const setOpen = isOpen => {
    document.body.classList.toggle("mobile-more-open", isOpen);
    button?.setAttribute("aria-expanded", String(isOpen));
    if (panel) panel.hidden = !isOpen;
    if (backdrop) backdrop.hidden = !isOpen;
  };

  button?.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  close?.addEventListener("click", () => setOpen(false));
  backdrop?.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
}

function adminApplyLumiIcons() {
  const navIcons = [
    ADMIN_LUMI_ICONS.dashboard,
    ADMIN_LUMI_ICONS.kpi,
    ADMIN_LUMI_ICONS.confirmed,
    ADMIN_LUMI_ICONS.delivered,
    ADMIN_LUMI_ICONS.revenue,
    ADMIN_LUMI_ICONS.subscriptions,
    ADMIN_LUMI_ICONS.delivery,
    ADMIN_LUMI_ICONS.customers,
    ADMIN_LUMI_ICONS.products,
    ADMIN_LUMI_ICONS.database
  ];

  document.querySelectorAll(".side-nav a > span:first-child").forEach((icon, index) => {
    icon.classList.add("nav-icon");
    icon.innerHTML = navIcons[index] || ADMIN_LUMI_ICONS.dashboard;
  });

  document.querySelectorAll(".bottom-nav [data-nav-key]").forEach(link => {
    const icon = link.querySelector("span:first-child");
    if (icon) icon.innerHTML = ADMIN_LUMI_ICONS[link.dataset.navKey] || ADMIN_LUMI_ICONS.dashboard;
  });

  document.querySelectorAll(".mobile-more-grid [data-nav-key]").forEach(link => {
    link.classList.toggle("active", link.dataset.navKey === "dashboard");
    const icon = link.querySelector("span:first-child");
    if (icon) icon.innerHTML = ADMIN_LUMI_ICONS[link.dataset.navKey] || ADMIN_LUMI_ICONS.dashboard;
  });

  document.querySelectorAll("[data-more-icon]").forEach(icon => {
    icon.innerHTML = ADMIN_LUMI_ICONS.more;
  });

  const toggleIcon = adminEls.sidebarToggle?.querySelector("span");
  if (toggleIcon) {
    toggleIcon.innerHTML = ADMIN_LUMI_ICONS.menu;
  }

  const refreshIcon = adminEls.refresh?.querySelector("span");
  if (refreshIcon) {
    refreshIcon.innerHTML = ADMIN_LUMI_ICONS.refresh;
  }

  document.querySelectorAll("[data-stat-icon]").forEach(icon => {
    icon.innerHTML = ADMIN_LUMI_ICONS[icon.dataset.statIcon] || ADMIN_LUMI_ICONS.dashboard;
  });

  document.querySelectorAll(".trend-icon").forEach(icon => {
    icon.innerHTML = ADMIN_LUMI_ICONS.trendUp;
  });

  document.querySelectorAll(".target-clock").forEach(icon => {
    icon.innerHTML = ADMIN_LUMI_ICONS.clock;
  });
}

function adminGetSupabase() {
  if (!window.supabaseClient) {
    throw new Error("Supabase connection missing.");
  }

  return window.supabaseClient;
}

function adminEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function adminCurrency(value) {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function adminRupee(value) {
  return `\u20b9${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function adminGetRevenueTarget() {
  const saved = Number(localStorage.getItem(ADMIN_TARGET_STORAGE_KEY));
  return saved > 0 ? saved : ADMIN_DEFAULT_DAILY_REVENUE_GOAL;
}

function adminSetRevenueTarget(value) {
  const target = Math.max(1, Math.round(Number(value) || ADMIN_DEFAULT_DAILY_REVENUE_GOAL));
  localStorage.setItem(ADMIN_TARGET_STORAGE_KEY, String(target));
  window.dispatchEvent(new CustomEvent("jfam:revenue-target-change", { detail: { target } }));
  return target;
}

function adminSyncTargetInput() {
  if (adminEls.targetRevenueInput && document.activeElement !== adminEls.targetRevenueInput) {
    adminEls.targetRevenueInput.value = String(adminGetRevenueTarget());
  }
}

function adminCommitTargetInput() {
  if (!adminEls.targetRevenueInput) return;
  const rawValue = Number(adminEls.targetRevenueInput.value);
  if (!rawValue || rawValue < 1) {
    adminEls.targetRevenueInput.value = String(adminGetRevenueTarget());
    return;
  }

  const target = adminSetRevenueTarget(rawValue);
  adminEls.targetRevenueInput.value = String(target);
  adminRenderStats();
  adminToast(`Revenue target updated to ${adminRupee(target)}.`);
}

function adminToast(message) {
  adminEls.toast.textContent = message;
  adminEls.toast.classList.add("active");
  clearTimeout(adminToast.timer);
  adminToast.timer = setTimeout(() => {
    adminEls.toast.classList.remove("active");
  }, 2600);
}

function adminSetLoginStatus(message) {
  adminEls.loginStatus.textContent = message || "";
}

function adminSetText(element, value) {
  if (element) element.textContent = value;
}

function adminUpdateGreeting() {
  if (!adminEls.greetingTitle) return;

  const hour = new Date().getHours();
  let greeting = "morning";

  if (hour >= 12 && hour < 17) {
    greeting = "afternoon";
  } else if (hour >= 17 || hour < 5) {
    greeting = "evening";
  }

  adminEls.greetingTitle.textContent = `Good ${greeting}, founder`;
}

function adminMarkClicked(element) {
  if (!element) return;
  clearTimeout(element.adminClickTimer);
  element.classList.add("is-clicked");
  element.adminClickTimer = setTimeout(() => {
    element.classList.remove("is-clicked");
  }, 220);
}

function adminSetSidebarCollapsed(isCollapsed) {
  adminEls.dashboard?.classList.toggle("sidebar-collapsed", isCollapsed);
  adminEls.sidebarToggle?.setAttribute("aria-expanded", String(!isCollapsed));
  adminEls.sidebarToggle?.setAttribute(
    "aria-label",
    isCollapsed ? "Expand sidebar" : "Collapse sidebar"
  );
  localStorage.setItem("jfamSidebarCollapsed", String(isCollapsed));
}

function adminApplyStatusSelectStyle(select) {
  if (!select) return;
  select.classList.remove("confirmed", "preparing", "out", "delivered", "cancelled", "is-selected");
  if (!select.value) return;

  select.classList.add(adminStatusClass(select.value), "is-selected");
}

function adminSyncOtpValue() {
  adminEls.otp.value = adminEls.otpDigits.map(input => input.value).join("");
}

function adminClearOtpDigits() {
  adminEls.otpDigits.forEach(input => {
    input.value = "";
  });
  adminSyncOtpValue();
}

function adminShowOtpScreen(email) {
  adminEls.loginTitle.textContent = "Verify OTP";
  adminEls.loginCopy.textContent = "Enter the 6 digit code sent to the admin email.";
  adminEls.otpEmail.textContent = email;
  adminEls.loginForm.classList.add("hidden");
  adminEls.otpForm.classList.remove("hidden");
  adminClearOtpDigits();
  adminEls.otpDigits[0]?.focus();
}

function adminShowEmailScreen() {
  adminState.authChecked = true;
  adminEls.loginPanel.classList.remove("hidden");
  adminEls.dashboard.classList.add("hidden");
  adminEls.loginTitle.textContent = "JFAM Orders";
  adminEls.loginCopy.textContent = "Sign in with the admin email that is added in Supabase.";
  adminEls.otpForm.classList.add("hidden");
  adminEls.loginForm.classList.remove("hidden");
  adminClearOtpDigits();
  localStorage.removeItem("jfamAdminEmail");
  if (adminState.resendTimer) clearInterval(adminState.resendTimer);
}

function adminStartResendTimer() {
  let remaining = ADMIN_RESEND_SECONDS;
  if (adminState.resendTimer) clearInterval(adminState.resendTimer);

  adminEls.resendOtp.disabled = true;
  adminEls.resendTimer.textContent = `Resend OTP in ${remaining}s`;

  adminState.resendTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(adminState.resendTimer);
      adminState.resendTimer = null;
      adminEls.resendOtp.disabled = false;
      adminEls.resendTimer.textContent = "You can resend OTP now";
      return;
    }

    adminEls.resendTimer.textContent = `Resend OTP in ${remaining}s`;
  }, 1000);
}

async function adminSendOtp(email) {
  adminSetLoginStatus("Sending OTP...");
  const { error } = await adminGetSupabase().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });

  if (error) {
    console.log(error);
    if (String(error.message || "").toLowerCase().includes("signups not allowed")) {
      adminSetLoginStatus("Admin email Supabase Auth me create nahi hai. Pehle Supabase dashboard me user add karo.");
    } else {
      adminSetLoginStatus(error.message);
    }
    return false;
  }

  localStorage.setItem("jfamAdminEmail", email);
  adminShowOtpScreen(email);
  adminStartResendTimer();
  adminSetLoginStatus("OTP sent. Check admin email.");
  return true;
}

async function adminIsCurrentUserAllowed() {
  const sb = adminGetSupabase();
  const { data: userResult, error: userError } = await sb.auth.getUser();
  const user = userResult?.user;

  if (userError || !user) {
    console.log(userError);
    return false;
  }

  const { data, error } = await sb
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.log(error);
    adminToast("Admin access check failed.");
    return false;
  }

  return Boolean(data?.user_id);
}

function adminOrderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function adminStatusClass(status) {
  const clean = String(status || "Confirmed").toLowerCase();
  if (clean.includes("out")) return "out";
  if (clean.includes("delivered")) return "delivered";
  if (clean.includes("cancel")) return "cancelled";
  if (clean.includes("preparing")) return "preparing";
  return "confirmed";
}

function adminNormalizeOrder(row) {
  const profile = row.profile || {};
  const items = Array.isArray(row.order_items) ? row.order_items : [];
  const normalizedItems = items
    .slice()
    .sort((a, b) => Number(a.item_index) - Number(b.item_index))
    .map(item => ({
      index: Number(item.item_index) || 0,
      name: item.product_name || "",
      price: window.JFAMPricing?.price(item.product_name, item.price) ?? Number(item.price) ?? 0,
      quantity: item.quantity || "",
      packets: Number(item.packets) || 1,
      startDate: item.start_date || "",
      endDate: item.end_date || "",
      slot: item.slot || "",
      plan: item.plan || "",
      cancelled: Boolean(item.cancelled),
      deliveryControlsSummary: item.delivery_controls_summary || ""
    }));

  return {
    id: row.id,
    userId: row.user_id,
    orderedAt: row.ordered_at,
    paymentMode: row.payment_mode || "",
    status: row.status || "Confirmed",
    codFee: Number(row.cod_fee) || 0,
    totalAmount: window.JFAMPricing?.orderTotal({ ...row, items: normalizedItems }) ?? Number(row.total_amount) ?? 0,
    customerName: profile.name || "",
    customerMobile: profile.mobile || "",
    customerEmail: profile.email || "",
    items: normalizedItems
  };
}

function adminFilteredOrders() {
  const query = (adminEls.search?.value || "").trim().toLowerCase();
  const status = adminEls.statusFilter?.value || "";

  return adminState.orders.filter(order => {
    if (status && order.status !== status) return false;
    if (!query) return true;

    const haystack = [
      order.id,
      order.customerName,
      order.customerMobile,
      order.customerEmail,
      order.paymentMode,
      order.status,
      ...order.items.map(item => item.name)
    ].join(" ").toLowerCase();

    return haystack.includes(query);
  });
}

function adminProductName(product, index) {
  return product.name || product.product_name || product.title || product.label || `Product ${index + 1}`;
}

function adminUniqueProductCount() {
  const names = new Set();

  ADMIN_PRODUCT_CATALOGUE.forEach(product => {
    names.add(product.trim().toLowerCase());
  });

  adminState.products.forEach((product, index) => {
    const name = String(adminProductName(product, index)).trim().toLowerCase();
    if (name) names.add(name);
  });

  adminState.orders.forEach(order => {
    order.items.forEach(item => {
      const name = String(item.name || "").trim().toLowerCase();
      if (name) names.add(name);
    });
  });

  return names.size;
}

function adminRenderStats() {
  const todayKey = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();
  const todayOrders = adminState.orders.filter(order =>
    new Date(order.orderedAt).toDateString() === todayKey
  );
  const yesterdayOrders = adminState.orders.filter(order =>
    new Date(order.orderedAt).toDateString() === yesterdayKey
  );
  const isConfirmed = order => order.status === "Confirmed";
  const isDelivered = order => order.status === "Delivered";
  const isOutForDelivery = order => order.status === "Out for Delivery";
  const isCancelled = order => order.status === "Cancelled";
  const deliveredRevenue = orders => orders.reduce((sum, order) => {
    if (!isDelivered(order)) return sum;
    return sum + Number(order.totalAmount || 0);
  }, 0);
  const uniqueCustomers = orders => new Set(orders.map(order => order.userId || order.customerMobile || order.customerEmail).filter(Boolean)).size;
  const trendText = (current, previous) => {
    if (previous === 0) return current > 0 ? "+100% from yesterday" : "+0% from yesterday";
    const change = Math.round(((current - previous) / previous) * 100);
    return `${change >= 0 ? "+" : ""}${change}% from yesterday`;
  };

  const confirmedToday = todayOrders.filter(isConfirmed).length;
  const confirmedYesterday = yesterdayOrders.filter(isConfirmed).length;
  const deliveredToday = todayOrders.filter(isDelivered).length;
  const deliveredYesterday = yesterdayOrders.filter(isDelivered).length;
  const outForDeliveryToday = todayOrders.filter(isOutForDelivery).length;
  const cancellationsToday = todayOrders.filter(isCancelled).length;
  const revenueToday = deliveredRevenue(todayOrders);
  const revenueYesterday = deliveredRevenue(yesterdayOrders);
  const subscribersToday = uniqueCustomers(todayOrders);
  const subscribersYesterday = uniqueCustomers(yesterdayOrders);
  const activeSubs = uniqueCustomers(adminState.orders.filter(order => !isCancelled(order)));
  const avgOrder = deliveredToday > 0 ? revenueToday / deliveredToday : 0;
  const openDrops = todayOrders.filter(order => isOutForDelivery(order) || order.status === "Preparing").length;
  const rateBase = deliveredToday + openDrops;
  const onTimeRate = rateBase > 0 ? Math.round((deliveredToday / rateBase) * 1000) / 10 : 0;
  const revenueTarget = adminGetRevenueTarget();
  const progressPercent = Math.min(Math.round((revenueToday / revenueTarget) * 100), 100);
  const progressColor = progressPercent >= 90 ? "#2f7d48" : progressPercent >= 50 ? "#cf6540" : "#c8483b";
  const productCount = adminUniqueProductCount();

  adminEls.total.textContent = confirmedToday;
  adminEls.confirmed.textContent = deliveredToday;
  adminEls.today.textContent = adminCurrency(revenueToday);
  adminEls.revenue.textContent = subscribersToday;

  if (adminEls.confirmedDetail) adminEls.confirmedDetail.textContent = "From customer app today";
  if (adminEls.deliveredDetail) adminEls.deliveredDetail.textContent = `${outForDeliveryToday} still out for delivery`;
  if (adminEls.revenueDeliveredDetail) adminEls.revenueDeliveredDetail.textContent = `Target ${adminRupee(revenueTarget)}`;
  if (adminEls.newSubscribersDetail) adminEls.newSubscribersDetail.textContent = `${cancellationsToday} cancellations today`;

  if (adminEls.confirmedTrend) adminEls.confirmedTrend.textContent = trendText(confirmedToday, confirmedYesterday);
  if (adminEls.deliveredTrend) adminEls.deliveredTrend.textContent = trendText(deliveredToday, deliveredYesterday);
  if (adminEls.revenueDeliveredTrend) adminEls.revenueDeliveredTrend.textContent = trendText(revenueToday, revenueYesterday);
  if (adminEls.newSubscribersTrend) adminEls.newSubscribersTrend.textContent = trendText(subscribersToday, subscribersYesterday);

  if (adminEls.targetPanel) {
    adminEls.targetPanel.style.setProperty("--target-progress", `${progressPercent}%`);
    adminEls.targetPanel.style.setProperty("--target-fill", progressColor);
  }
  if (adminEls.targetRevenueValue) adminEls.targetRevenueValue.textContent = adminRupee(revenueToday);
  adminSyncTargetInput();
  if (adminEls.targetProgressSummary) adminEls.targetProgressSummary.textContent = `${progressPercent}% complete · ${openDrops} orders still in transit`;
  if (adminEls.targetOnTimeRate) adminEls.targetOnTimeRate.textContent = `${onTimeRate}%`;
  if (adminEls.targetAvgOrder) adminEls.targetAvgOrder.textContent = adminRupee(avgOrder);
  if (adminEls.targetActiveSubs) adminEls.targetActiveSubs.textContent = activeSubs.toLocaleString("en-IN");
  if (adminEls.targetPendingDrops) adminEls.targetPendingDrops.textContent = openDrops;

  adminSetText(adminEls.exploreConfirmed, confirmedToday.toLocaleString("en-IN"));
  adminSetText(adminEls.exploreDelivered, deliveredToday.toLocaleString("en-IN"));
  adminSetText(adminEls.exploreRevenue, adminRupee(revenueToday));
  adminSetText(adminEls.exploreKpi, `${onTimeRate}%`);
  adminSetText(adminEls.exploreSubscriptions, activeSubs.toLocaleString("en-IN"));
  adminSetText(adminEls.exploreDelivery, `${onTimeRate}% on-time`);
  adminSetText(adminEls.exploreCustomers, uniqueCustomers(adminState.orders).toLocaleString("en-IN"));
  adminSetText(adminEls.exploreProducts, `${productCount.toLocaleString("en-IN")} SKUs`);
}

function adminRenderOrders() {
  adminRenderStats();
  if (!adminEls.list) return;

  const orders = adminFilteredOrders();

  if (orders.length === 0) {
    adminEls.list.innerHTML = '<div class="empty-state">No orders found.</div>';
    return;
  }

  adminEls.list.innerHTML = orders.map(order => {
    const itemsHtml = order.items.map(item => `
      <div class="item-row">
        <div>
          <strong>${adminEscape(item.name)}</strong>
          <span>${adminEscape(item.quantity)} | ${adminEscape(item.packets)} packet | ${adminEscape(item.plan)} | ${adminEscape(item.slot)}</span>
          <span>${adminEscape(item.startDate || "-")} to ${adminEscape(item.endDate || "-")}</span>
          ${item.deliveryControlsSummary ? `<span>${adminEscape(item.deliveryControlsSummary)}</span>` : ""}
        </div>
        <strong>${adminCurrency(item.price * item.packets)}</strong>
      </div>
    `).join("");

    const statusOptions = ADMIN_STATUS_OPTIONS.map(status => `
      <option value="${adminEscape(status)}" ${status === order.status ? "selected" : ""}>${adminEscape(status)}</option>
    `).join("");

    return `
      <article class="order-card ${order.id === adminState.highlightedOrderId ? "new-order" : ""}" data-order-id="${adminEscape(order.id)}">
        <div class="order-top">
          <div>
            <p class="order-title">
              <strong>${adminEscape(order.id)}</strong>
              <span class="badge ${adminStatusClass(order.status)}">${adminEscape(order.status)}</span>
            </p>
            <div class="order-meta">
              <span>${adminEscape(adminOrderDate(order.orderedAt))}</span>
              <span>${adminEscape(order.customerName || "Customer")} | ${adminEscape(order.customerMobile || "No mobile")}</span>
              <span>${adminEscape(order.customerEmail || "")}</span>
              <span>${adminEscape(order.paymentMode)} | Total ${adminCurrency(order.totalAmount)}</span>
            </div>
          </div>
          <div class="order-status">
            <select class="status-select ${adminStatusClass(order.status)} is-selected" data-order-status="${adminEscape(order.id)}">${statusOptions}</select>
            <button type="button" class="${order.id === adminState.clickedStatusOrderId ? "is-clicked" : ""}" data-save-status="${adminEscape(order.id)}">Update Status</button>
          </div>
        </div>
        <div class="items-list">${itemsHtml || '<span class="empty-state">No item details available.</span>'}</div>
      </article>
    `;
  }).join("");
}

async function adminLoadOrders({ highlightLatest = false } = {}) {
  const sb = adminGetSupabase();
  const { data, error } = await sb
    .from("orders")
    .select(`
      id,
      user_id,
      ordered_at,
      payment_mode,
      status,
      cod_fee,
      total_amount,
      order_items (
        item_index,
        product_name,
        price,
        quantity,
        packets,
        start_date,
        end_date,
        slot,
        plan,
        cancelled,
        delivery_controls_summary
      )
    `)
    .order("ordered_at", { ascending: false });

  if (error) {
    console.log(error);
    adminToast("Orders load nahi hue. Admin RLS setup check karo.");
    return;
  }

  const userIds = [...new Set((data || []).map(order => order.user_id).filter(Boolean))];
  const profilesById = new Map();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await sb
      .from("profiles")
      .select("id,name,mobile,email")
      .in("id", userIds);

    if (profileError) {
      console.log(profileError);
    } else {
      (profiles || []).forEach(profile => {
        profilesById.set(profile.id, profile);
      });
    }
  }

  const previousFirstId = adminState.orders[0]?.id || "";
  adminState.orders = (data || []).map(order => adminNormalizeOrder({
    ...order,
    profile: profilesById.get(order.user_id) || {}
  }));

  try {
    const { data: products, error: productsError } = await sb
      .from("product_catalog")
      .select("*");

    if (productsError) {
      console.log(productsError);
      adminState.products = [];
    } else {
      adminState.products = products || [];
    }
  } catch (error) {
    console.log(error);
    adminState.products = [];
  }

  if (highlightLatest && adminState.orders[0]?.id && adminState.orders[0].id !== previousFirstId) {
    adminState.highlightedOrderId = adminState.orders[0].id;
    adminNotifyNewOrder(adminState.orders[0]);
  }

  adminRenderOrders();
}

function adminNotifyNewOrder(order) {
  adminToast(`New order ${order.id}`);

  if (adminState.soundEnabled) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 220);
  }

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("New JFAM order", {
      body: `${order.id} | ${order.customerName || "Customer"} | ${adminCurrency(order.totalAmount)}`
    });
  }
}

async function adminUpdateOrderStatus(orderId) {
  const select = document.querySelector(`[data-order-status="${CSS.escape(orderId)}"]`);
  const status = select?.value;
  if (!status) return;

  const sb = adminGetSupabase();
  const { error } = await sb
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    console.log(error);
    adminToast("Status update failed.");
    return;
  }

  adminToast("Order status updated.");
  await adminLoadOrders();
}

function adminStartRealtime() {
  const sb = adminGetSupabase();
  if (adminState.channel) sb.removeChannel(adminState.channel);

  adminState.channel = sb
    .channel("jfam-admin-orders")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => adminLoadOrders({ highlightLatest: true })
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "order_items" },
      () => adminLoadOrders()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "product_catalog" },
      () => adminLoadOrders()
    )
    .subscribe();
}

async function adminShowDashboard() {
  const isAllowed = await adminIsCurrentUserAllowed();
  if (!isAllowed) {
    await adminGetSupabase().auth.signOut();
    adminShowEmailScreen();
    adminSetLoginStatus("This email is not added in admin_users.");
    return;
  }

  adminState.authChecked = true;
  adminEls.loginPanel.classList.add("hidden");
  adminEls.dashboard.classList.remove("hidden");
  adminUpdateGreeting();
  await adminLoadOrders();
  adminStartRealtime();
}

adminEls.loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = adminEls.email.value.trim().toLowerCase();
  if (!email) return;

  if (email !== ADMIN_ALLOWED_EMAIL) {
    adminShowEmailScreen();
    adminSetLoginStatus("Access only for admin granted!!!");
    return;
  }

  await adminSendOtp(email);
});

adminEls.otpForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = localStorage.getItem("jfamAdminEmail") || adminEls.email.value.trim().toLowerCase();
  const token = adminEls.otp.value.trim();
  if (!email || token.length !== 6) return;

  adminSetLoginStatus("Verifying...");
  const { error } = await adminGetSupabase().auth.verifyOtp({
    email,
    token,
    type: "email"
  });

  if (error) {
    console.log(error);
    adminSetLoginStatus("Invalid OTP.");
    return;
  }

  adminSetLoginStatus("");
  await adminShowDashboard();
});

adminEls.otpDigits.forEach((input, index) => {
  input.addEventListener("input", () => {
    const digits = input.value.replace(/\D/g, "");
    if (digits.length > 1) {
      adminEls.otpDigits.forEach((digitInput, digitIndex) => {
        digitInput.value = digits[digitIndex] || "";
      });
      adminSyncOtpValue();
      adminEls.otpDigits[Math.min(digits.length, adminEls.otpDigits.length) - 1]?.focus();
      return;
    }

    input.value = digits.slice(0, 1);
    adminSyncOtpValue();
    if (input.value && index < adminEls.otpDigits.length - 1) {
      adminEls.otpDigits[index + 1].focus();
    }
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Backspace" && !input.value && index > 0) {
      adminEls.otpDigits[index - 1].focus();
    }
  });

  input.addEventListener("paste", event => {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;

    adminEls.otpDigits.forEach((digitInput, digitIndex) => {
      digitInput.value = digits[digitIndex] || "";
    });
    adminSyncOtpValue();
    adminEls.otpDigits[Math.min(digits.length, adminEls.otpDigits.length) - 1]?.focus();
  });
});

adminEls.resendOtp.addEventListener("click", async () => {
  const email = localStorage.getItem("jfamAdminEmail") || adminEls.email.value.trim().toLowerCase();
  if (email !== ADMIN_ALLOWED_EMAIL) {
    adminShowEmailScreen();
    adminSetLoginStatus("Access only for admin granted!!!");
    return;
  }

  await adminSendOtp(email);
});

adminEls.refresh?.addEventListener("click", async () => {
  adminMarkClicked(adminEls.refresh);
  await adminLoadOrders();
  adminToast("Orders refreshed.");
});
adminEls.targetRevenueInput?.addEventListener("change", adminCommitTargetInput);
adminEls.targetRevenueInput?.addEventListener("blur", adminCommitTargetInput);
adminEls.targetRevenueInput?.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    adminCommitTargetInput();
    adminEls.targetRevenueInput.blur();
  }

  if (event.key === "Escape") {
    adminEls.targetRevenueInput.value = String(adminGetRevenueTarget());
    adminEls.targetRevenueInput.blur();
  }
});
window.addEventListener("storage", event => {
  if (event.key === ADMIN_TARGET_STORAGE_KEY) adminRenderStats();
});
window.addEventListener("jfam:revenue-target-change", adminRenderStats);
adminEls.sidebarToggle?.addEventListener("click", () => {
  adminSetSidebarCollapsed(!adminEls.dashboard.classList.contains("sidebar-collapsed"));
});
adminEls.search?.addEventListener("input", adminRenderOrders);
adminEls.statusFilter?.addEventListener("change", () => {
  adminApplyStatusSelectStyle(adminEls.statusFilter);
  adminRenderOrders();
});

document.querySelectorAll('a[href="index.html"]').forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    adminEls.dashboard?.scrollTo?.({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

adminEls.list?.addEventListener("click", event => {
  const button = event.target.closest("[data-save-status]");
  if (!button) return;
  adminState.clickedStatusOrderId = button.dataset.saveStatus;
  adminMarkClicked(button);
  adminUpdateOrderStatus(button.dataset.saveStatus);
});

adminEls.list?.addEventListener("change", event => {
  const select = event.target.closest("[data-order-status]");
  if (!select) return;
  adminApplyStatusSelectStyle(select);
});

adminSetupMobileMore();
adminApplyLumiIcons();
adminSetSidebarCollapsed(localStorage.getItem("jfamSidebarCollapsed") === "true");
adminUpdateGreeting();

adminGetSupabase().auth.getSession().then(({ data }) => {
  if (data?.session) {
    adminShowDashboard();
  } else {
    adminShowEmailScreen();
  }
}).catch(error => {
  console.log(error);
  adminShowEmailScreen();
  adminSetLoginStatus("Could not restore session. Please try again.");
});
