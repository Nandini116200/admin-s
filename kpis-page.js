const kpiIcons = {
  menu: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  kpis: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7M4 19h16"/></svg>',
  confirmed: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 6"/><path d="M4 20h16"/></svg>',
  delivery: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10v9H4zM14 10h4l3 3v3h-7z"/><path d="M8 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
  revenue: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10M7 9h10M9 5c4 0 6 2 6 5s-2 5-6 5l6 4"/></svg>',
  subscriptions: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3"/><path d="M4 11V8a2 2 0 0 1 2-2h14"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v3a2 2 0 0 1-2 2H4"/></svg>',
  customers: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0"/><path d="M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-5-6"/></svg>',
  products: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
  clock: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
  pause: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
  trendUp: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l5-5 4 4 7-7"/><path d="M15 8h5v5"/></svg>',
  trendDown: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l5 5 4-4 7 7"/><path d="M15 16h5v-5"/></svg>'
};

const lowerIsBetterMetrics = new Set([
  "cancellations",
  "avgDeliveryTime",
  "churn30d",
  "pausedPlans"
]);

function kpiCurrency(value) {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function kpiPercent(value) {
  const number = Number.isFinite(value) ? value : 0;
  return `${Math.round(number)}%`;
}

function kpiCustomerKey(order) {
  return order.userId || order.customerMobile || order.customerEmail || order.id;
}

function kpiDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function kpiIsSameDate(value, date) {
  const itemDate = kpiDate(value);
  return Boolean(itemDate) && itemDate.toDateString() === date.toDateString();
}

function kpiStartOfDay(offsetDays = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

function kpiInLastDays(value, days) {
  const date = kpiDate(value);
  if (!date) return false;
  const since = kpiStartOfDay(-days);
  return date >= since;
}

function kpiIsDelivered(order) {
  return String(order.status).toLowerCase() === "delivered";
}

function kpiIsCancelled(order) {
  return String(order.status).toLowerCase().includes("cancel");
}

function kpiIsPausedText(value) {
  return String(value || "").toLowerCase().includes("pause");
}

function kpiIsSubscriptionItem(item) {
  const plan = String(item.plan || "").toLowerCase();
  return Boolean(plan && !["one time", "once", "single"].includes(plan)) || Boolean(item.startDate || item.endDate);
}

function kpiItemValue(item) {
  return (Number(item.price) || 0) * (Number(item.packets) || 1);
}

function kpiUniqueCount(orders) {
  return new Set(orders.map(kpiCustomerKey).filter(Boolean)).size;
}

function kpiRate(part, total) {
  return total > 0 ? (part / total) * 100 : 0;
}

function kpiTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function kpiFormatDuration(hours) {
  if (!hours) return "0h";
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  return `${Math.round(hours / 24)}d`;
}

function kpiNormalizeOrder(row) {
  const profile = row.profile || {};
  return {
    id: row.id,
    userId: row.user_id,
    orderedAt: row.ordered_at,
    updatedAt: row.updated_at,
    status: row.status || "Confirmed",
    totalAmount: Number(row.total_amount) || 0,
    customerMobile: profile.mobile || "",
    customerEmail: profile.email || "",
    items: (Array.isArray(row.order_items) ? row.order_items : []).map(item => ({
      price: Number(item.price) || 0,
      packets: Number(item.packets) || 1,
      startDate: item.start_date || "",
      endDate: item.end_date || "",
      plan: item.plan || "",
      cancelled: Boolean(item.cancelled)
    }))
  };
}

function kpiSubscriptionValue(orders) {
  return orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => {
    if (!kpiIsSubscriptionItem(item) || item.cancelled) return itemSum;
    return itemSum + kpiItemValue(item);
  }, 0), 0);
}

function kpiMrrEstimate(orders) {
  return orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => {
    if (!kpiIsSubscriptionItem(item) || item.cancelled) return itemSum;
    const plan = String(item.plan || "").toLowerCase();
    const value = kpiItemValue(item);
    if (plan.includes("week")) return itemSum + value * 4;
    if (plan.includes("day")) return itemSum + value * 30;
    return itemSum + value;
  }, 0), 0);
}

function kpiAverageSubscriptionAge(orders) {
  const ages = orders.flatMap(order => order.items)
    .filter(item => kpiIsSubscriptionItem(item) && item.startDate && !item.cancelled)
    .map(item => {
      const start = kpiDate(item.startDate);
      if (!start) return 0;
      return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
    });

  if (!ages.length) return 0;
  return ages.reduce((sum, age) => sum + age, 0) / ages.length;
}

function kpiDeliveredRevenue(orders) {
  return orders.filter(kpiIsDelivered).reduce((sum, order) => sum + order.totalAmount, 0);
}

function kpiAverageOrderValue(orders) {
  const delivered = orders.filter(kpiIsDelivered);
  return delivered.length ? kpiDeliveredRevenue(delivered) / delivered.length : 0;
}

function kpiRepeatCustomerRate(orders) {
  const customers = new Map();
  orders.forEach(order => {
    const key = kpiCustomerKey(order);
    if (key) customers.set(key, (customers.get(key) || 0) + 1);
  });
  if (!customers.size) return 0;
  return kpiRate([...customers.values()].filter(count => count > 1).length, customers.size);
}

function kpiChurn30d(orders) {
  const activeSubscribers = kpiUniqueCount(orders.filter(order => !kpiIsCancelled(order) && order.items.some(kpiIsSubscriptionItem)));
  const cancelledOrders = orders.filter(order => kpiIsCancelled(order) && kpiInLastDays(order.orderedAt, 30));
  const cancelledItems = orders
    .filter(order => kpiInLastDays(order.orderedAt, 30))
    .flatMap(order => order.items)
    .filter(item => item.cancelled);
  return kpiRate(cancelledOrders.length + cancelledItems.length, activeSubscribers + cancelledOrders.length + cancelledItems.length);
}

function kpiPausedPlans(orders) {
  return orders.flatMap(order => order.items).filter(item => kpiIsPausedText(item.plan)).length
    + orders.filter(order => kpiIsPausedText(order.status)).length;
}

function kpiBuildMetrics(orders) {
  const today = kpiStartOfDay();
  const yesterday = kpiStartOfDay(-1);
  const todayOrders = orders.filter(order => kpiIsSameDate(order.orderedAt, today));
  const yesterdayOrders = orders.filter(order => kpiIsSameDate(order.orderedAt, yesterday));
  const historicalOrders = orders.filter(order => {
    const date = kpiDate(order.orderedAt);
    return Boolean(date) && date < today;
  });
  const weekOrders = orders.filter(order => kpiInLastDays(order.orderedAt, 7));
  const previousWeekOrders = orders.filter(order => {
    const date = kpiDate(order.orderedAt);
    if (!date) return false;
    return date >= kpiStartOfDay(-14) && date < kpiStartOfDay(-7);
  });
  const deliveredOrders = orders.filter(kpiIsDelivered);
  const deliveredToday = todayOrders.filter(kpiIsDelivered);
  const deliveredYesterday = yesterdayOrders.filter(kpiIsDelivered);
  const activeOrders = orders.filter(order => !kpiIsCancelled(order));
  const cancelledOrders = orders.filter(kpiIsCancelled);
  const cancelledToday = todayOrders.filter(kpiIsCancelled);
  const cancelledYesterday = yesterdayOrders.filter(kpiIsCancelled);
  const revenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const revenueToday = deliveredToday.reduce((sum, order) => sum + order.totalAmount, 0);
  const revenueYesterday = deliveredYesterday.reduce((sum, order) => sum + order.totalAmount, 0);
  const repeatCustomers = new Map();
  orders.forEach(order => {
    const key = kpiCustomerKey(order);
    if (key) repeatCustomers.set(key, (repeatCustomers.get(key) || 0) + 1);
  });
  const uniqueCustomers = repeatCustomers.size;
  const deliveryDurationsFor = orderSet => orderSet
    .filter(kpiIsDelivered)
    .map(order => {
      const start = kpiDate(order.orderedAt);
      const end = kpiDate(order.updatedAt);
      if (!start || !end || end < start) return 0;
      return (end.getTime() - start.getTime()) / 3600000;
    })
    .filter(Boolean);
  const averageDuration = durations => durations.length
    ? durations.reduce((sum, hours) => sum + hours, 0) / durations.length
    : 0;
  const deliveryDurations = deliveryDurationsFor(deliveredOrders);
  const todayDeliveryDurations = deliveryDurationsFor(todayOrders);
  const yesterdayDeliveryDurations = deliveryDurationsFor(yesterdayOrders);
  const avgDeliveryHours = deliveryDurations.length
    ? deliveryDurations.reduce((sum, hours) => sum + hours, 0) / deliveryDurations.length
    : 0;
  const activeSubscribers = kpiUniqueCount(activeOrders.filter(order => order.items.some(kpiIsSubscriptionItem)));
  const historicalActiveSubscribers = kpiUniqueCount(historicalOrders.filter(order => !kpiIsCancelled(order) && order.items.some(kpiIsSubscriptionItem)));
  const newSubscribersToday = kpiUniqueCount(todayOrders.filter(order => order.items.some(kpiIsSubscriptionItem)));
  const newSubscribersYesterday = kpiUniqueCount(yesterdayOrders.filter(order => order.items.some(kpiIsSubscriptionItem)));
  const subscriptionOrders = orders.filter(order => order.items.some(kpiIsSubscriptionItem));
  const weeklySignupRate = kpiRate(kpiUniqueCount(weekOrders.filter(order => order.items.some(kpiIsSubscriptionItem))), Math.max(kpiUniqueCount(orders), 1));
  const previousWeeklySignupRate = kpiRate(kpiUniqueCount(previousWeekOrders.filter(order => order.items.some(kpiIsSubscriptionItem))), Math.max(kpiUniqueCount(orders), 1));
  const fulfillmentRate = kpiRate(deliveredOrders.length, activeOrders.length);
  const yesterdayFulfillmentRate = kpiRate(deliveredYesterday.length, yesterdayOrders.filter(order => !kpiIsCancelled(order)).length);
  const firstAttemptSuccess = kpiRate(deliveredOrders.length, deliveredOrders.length + cancelledOrders.length);
  const avgOrderValue = deliveredOrders.length ? revenue / deliveredOrders.length : 0;
  const avgOrderToday = deliveredToday.length ? revenueToday / deliveredToday.length : 0;
  const avgOrderYesterday = deliveredYesterday.length ? revenueYesterday / deliveredYesterday.length : 0;
  const subscriptionRevenue = kpiSubscriptionValue(deliveredOrders);
  const subscriptionRevenueToday = kpiSubscriptionValue(deliveredToday);
  const subscriptionRevenueYesterday = kpiSubscriptionValue(deliveredYesterday);
  const subscriptionRevenueShare = kpiRate(subscriptionRevenue, revenue);
  const subscriptionRevenueShareToday = kpiRate(subscriptionRevenueToday, revenueToday);
  const subscriptionRevenueShareYesterday = kpiRate(subscriptionRevenueYesterday, revenueYesterday);
  const mrrEst = kpiMrrEstimate(activeOrders);
  const historicalMrrEst = kpiMrrEstimate(historicalOrders.filter(order => !kpiIsCancelled(order)));
  const churn30d = kpiChurn30d(orders);
  const historicalChurn30d = kpiChurn30d(historicalOrders);
  const pausedPlans = kpiPausedPlans(orders);
  const historicalPausedPlans = kpiPausedPlans(historicalOrders);
  const avgSubscriptionAge = kpiAverageSubscriptionAge(activeOrders);
  const historicalAvgSubscriptionAge = kpiAverageSubscriptionAge(historicalOrders.filter(order => !kpiIsCancelled(order)));
  const customerLtv = uniqueCustomers ? revenue / uniqueCustomers : 0;
  const historicalCustomerCount = kpiUniqueCount(historicalOrders);
  const historicalCustomerLtv = historicalCustomerCount ? kpiDeliveredRevenue(historicalOrders) / historicalCustomerCount : 0;

  return {
    activeSubscribers: {
      value: activeSubscribers.toLocaleString("en-IN"),
      detail: `${subscriptionOrders.length.toLocaleString("en-IN")} subscription orders stored`,
      current: activeSubscribers,
      previous: historicalActiveSubscribers
    },
    newSubscribers: {
      value: newSubscribersToday.toLocaleString("en-IN"),
      detail: `${newSubscribersYesterday.toLocaleString("en-IN")} subscription signups yesterday`,
      current: newSubscribersToday,
      previous: newSubscribersYesterday
    },
    cancellations: {
      value: cancelledToday.length.toLocaleString("en-IN"),
      detail: `${cancelledYesterday.length.toLocaleString("en-IN")} cancellations yesterday`,
      current: cancelledToday.length,
      previous: cancelledYesterday.length
    },
    weeklySignupRate: {
      value: kpiPercent(weeklySignupRate),
      detail: `${kpiUniqueCount(weekOrders.filter(order => order.items.some(kpiIsSubscriptionItem))).toLocaleString("en-IN")} subscriber signups in stored 7-day window`,
      current: weeklySignupRate,
      previous: previousWeeklySignupRate
    },
    onTimeDelivery: {
      value: kpiPercent(kpiRate(deliveredToday.length, todayOrders.filter(order => !kpiIsCancelled(order)).length)),
      detail: `${deliveredToday.length} delivered from ${todayOrders.length} orders today`,
      current: deliveredToday.length,
      previous: deliveredYesterday.length
    },
    firstAttemptSuccess: {
      value: kpiPercent(firstAttemptSuccess),
      detail: `${deliveredOrders.length.toLocaleString("en-IN")} delivered vs ${cancelledOrders.length.toLocaleString("en-IN")} cancelled stored orders`,
      current: firstAttemptSuccess,
      previous: kpiRate(deliveredYesterday.length, deliveredYesterday.length + cancelledYesterday.length)
    },
    avgDeliveryTime: {
      value: kpiFormatDuration(avgDeliveryHours),
      detail: `${deliveryDurations.length.toLocaleString("en-IN")} delivered orders with update timestamps`,
      current: averageDuration(todayDeliveryDurations),
      previous: averageDuration(yesterdayDeliveryDurations)
    },
    fulfillmentRate: {
      value: kpiPercent(fulfillmentRate),
      detail: `${deliveredOrders.length.toLocaleString("en-IN")} delivered from ${activeOrders.length.toLocaleString("en-IN")} active stored orders`,
      current: fulfillmentRate,
      previous: yesterdayFulfillmentRate
    },
    avgOrderValue: {
      value: kpiCurrency(avgOrderValue),
      detail: `${deliveredOrders.length.toLocaleString("en-IN")} delivered orders counted`,
      current: avgOrderToday,
      previous: avgOrderYesterday
    },
    subscriptionRevenueShare: {
      value: kpiPercent(subscriptionRevenueShare),
      detail: `${kpiCurrency(subscriptionRevenue)} subscription revenue from stored delivered orders`,
      current: subscriptionRevenueShareToday,
      previous: subscriptionRevenueShareYesterday
    },
    mrrEst: {
      value: kpiCurrency(mrrEst),
      detail: `${activeSubscribers.toLocaleString("en-IN")} active subscriber base used`,
      current: mrrEst,
      previous: historicalMrrEst
    },
    repeatCustomerRate: {
      value: kpiPercent(kpiRepeatCustomerRate(orders)),
      detail: `${uniqueCustomers.toLocaleString("en-IN")} unique customers in stored orders`,
      current: kpiRepeatCustomerRate(orders),
      previous: kpiRepeatCustomerRate(historicalOrders)
    },
    churn30d: {
      value: kpiPercent(churn30d),
      detail: `${cancelledOrders.filter(order => kpiInLastDays(order.orderedAt, 30)).length.toLocaleString("en-IN")} cancelled orders in stored 30-day window`,
      current: churn30d,
      previous: historicalChurn30d
    },
    pausedPlans: {
      value: pausedPlans.toLocaleString("en-IN"),
      detail: `${pausedPlans.toLocaleString("en-IN")} pause signals found in stored plan/status data`,
      current: pausedPlans,
      previous: historicalPausedPlans
    },
    avgSubscriptionAge: {
      value: `${Math.round(avgSubscriptionAge)}d`,
      detail: `${activeOrders.flatMap(order => order.items).filter(item => kpiIsSubscriptionItem(item) && item.startDate && !item.cancelled).length.toLocaleString("en-IN")} active subscription item dates counted`,
      current: avgSubscriptionAge,
      previous: historicalAvgSubscriptionAge
    },
    customerLtv: {
      value: kpiCurrency(customerLtv),
      detail: `${kpiCurrency(revenue)} delivered revenue across ${uniqueCustomers.toLocaleString("en-IN")} customers`,
      current: customerLtv,
      previous: historicalCustomerLtv
    }
  };
}

function kpiRenderMetric(key, metric) {
  const value = document.querySelector(`[data-kpi-value="${key}"]`);
  const detail = document.querySelector(`[data-kpi-detail="${key}"]`);
  const change = document.querySelector(`[data-kpi-change="${key}"]`);
  const trend = kpiTrend(metric.current, metric.previous);
  const isDecrease = trend < 0;
  const isGood = lowerIsBetterMetrics.has(key) ? isDecrease || trend === 0 : !isDecrease;

  if (value) value.textContent = metric.value;
  if (detail && metric.detail) detail.textContent = metric.detail;

  if (change) {
    change.classList.toggle("decrease", !isGood);
    change.classList.toggle("increase", isGood);
    const icon = change.querySelector(".trend-icon");
    const label = change.querySelector("span:last-child");
    if (icon) icon.innerHTML = isDecrease ? kpiIcons.trendDown : kpiIcons.trendUp;
    const trendWord = trend === 0 ? "" : isDecrease ? " dec" : " increased";
    if (label) label.textContent = `${Math.abs(Math.round(trend))}%${trendWord} from yesterday`;
  }
}

function kpiRender(metrics) {
  Object.entries(metrics).forEach(([key, metric]) => kpiRenderMetric(key, metric));
}

function kpiRenderIcons() {
  document.querySelectorAll("[data-kpi-icon]").forEach(icon => {
    icon.innerHTML = kpiIcons[icon.dataset.kpiIcon] || kpiIcons.kpis;
  });
}

async function kpiLoadOrders() {
  const sb = window.supabaseClient;
  if (!sb) throw new Error("Supabase connection missing.");

  const { data, error } = await sb
    .from("orders")
    .select(`
      id,
      user_id,
      ordered_at,
      updated_at,
      status,
      total_amount,
      order_items (
        price,
        packets,
        start_date,
        end_date,
        plan,
        cancelled
      )
    `)
    .order("ordered_at", { ascending: false });

  if (error) throw error;

  const userIds = [...new Set((data || []).map(order => order.user_id).filter(Boolean))];
  const profilesById = new Map();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await sb
      .from("profiles")
      .select("id,mobile,email")
      .in("id", userIds);

    if (!profileError) {
      (profiles || []).forEach(profile => profilesById.set(profile.id, profile));
    }
  }

  return (data || []).map(order => kpiNormalizeOrder({
    ...order,
    profile: profilesById.get(order.user_id) || {}
  }));
}

async function kpiRefresh() {
  try {
    const orders = await kpiLoadOrders();
    kpiRender(kpiBuildMetrics(orders));
  } catch (error) {
    console.log(error);
    kpiRender(kpiBuildMetrics([]));
  }
}

function setupKpiPage() {
  document.title = "Key performance | JFAM Admin";
  pageApplyIcons("kpis");
  pageSetSidebarCollapsed(localStorage.getItem("jfamSidebarCollapsed") === "true");

  document.getElementById("sidebarToggleBtn")?.addEventListener("click", () => {
    const dashboard = document.getElementById("adminDashboard");
    pageSetSidebarCollapsed(!dashboard?.classList.contains("sidebar-collapsed"));
  });

  kpiRenderIcons();
  kpiRefresh();

  window.supabaseClient
    ?.channel("jfam-kpi-orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, kpiRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, kpiRefresh)
    .subscribe();
}

setupKpiPage();
