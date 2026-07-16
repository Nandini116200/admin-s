const REVENUE_TARGET = 45000;

const revenueIcons = {
  revenue: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10M7 9h10M9 5c4 0 6 2 6 5s-2 5-6 5l6 4"/></svg>',
  wallet: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h15a2 2 0 0 1 2 2v9H4z"/><path d="M4 7V5h13"/><path d="M17 13h4"/></svg>',
  trendUp: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l5-5 4 4 7-7"/><path d="M15 8h5v5"/></svg>',
  trendDown: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l5 5 4-4 7 7"/><path d="M15 16h5v-5"/></svg>',
  target: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>'
};

let revenueOrders = [];

function revenueEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function revenueCurrency(value) {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function revenueCurrencyShort(value) {
  const number = Math.round(Number(value) || 0);
  if (number >= 100000) return `Rs. ${Math.round(number / 1000)}k`;
  if (number >= 1000) return `Rs. ${Math.round(number / 1000)}k`;
  return `Rs. ${number}`;
}

function revenueDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function revenueStartOfDay(offset = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function revenueIsDelivered(order) {
  const status = String(order.status || "").toLowerCase();
  return status.includes("deliver") && !status.includes("out");
}

function revenueOrderDate(order) {
  return revenueDate(order.updatedAt || order.orderedAt);
}

function revenueIsToday(order) {
  const date = revenueOrderDate(order);
  const start = revenueStartOfDay();
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return Boolean(date && date >= start && date <= end);
}

function revenueInLastDays(order, days) {
  const date = revenueOrderDate(order);
  return Boolean(date && date >= revenueStartOfDay(-(days - 1)) && date <= new Date());
}

function revenueItemValue(item) {
  return (Number(item.price) || 0) * (Number(item.packets) || 1);
}

function revenueCategory(name) {
  const clean = String(name || "").toLowerCase();
  if (clean.includes("curd") || clean.includes("dahi")) return "Curd";
  if (clean.includes("paneer")) return "Paneer";
  if (clean.includes("ghee")) return "Ghee";
  if (clean.includes("milk") || clean.includes("doodh")) return "Milk";
  return "Other";
}

function revenueArea(order) {
  return order.area || "Area not stored";
}

function revenueNormalizeOrder(row) {
  const profile = row.profile || {};
  return {
    id: row.id,
    userId: row.user_id,
    orderedAt: row.ordered_at,
    updatedAt: row.updated_at,
    status: row.status || "Confirmed",
    totalAmount: Number(row.total_amount) || 0,
    area: row.area || row.address_area || row.delivery_area || row.shipping_area || row.locality || row.city || row.pincode || profile.area || profile.address_area || profile.delivery_area || profile.locality || profile.city || profile.pincode || profile.address || "Area not stored",
    items: (Array.isArray(row.order_items) ? row.order_items : []).map(item => ({
      name: item.product_name || "Other",
      price: Number(item.price) || 0,
      packets: Number(item.packets) || 1
    }))
  };
}

function revenueDeliveredOrders() {
  return revenueOrders.filter(order => revenueIsDelivered(order) && revenueOrderDate(order) <= new Date());
}

function revenueSum(orders) {
  return orders.reduce((sum, order) => sum + order.totalAmount, 0);
}

function revenueTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function revenueRenderIcons() {
  document.querySelectorAll("[data-revenue-icon]").forEach(icon => {
    icon.innerHTML = revenueIcons[icon.dataset.revenueIcon] || revenueIcons.revenue;
  });
}

function revenueSetText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function revenueRenderTrend(id, current, previous, lowerIsBetter = false) {
  const element = document.getElementById(id);
  if (!element) return;
  const trend = revenueTrend(current, previous);
  const isDecrease = trend < 0;
  const isGood = lowerIsBetter ? isDecrease || trend === 0 : !isDecrease;
  element.classList.toggle("decrease", !isGood);
  const icon = element.querySelector(".trend-icon");
  const label = element.querySelector("span:last-child");
  if (icon) icon.innerHTML = isDecrease ? revenueIcons.trendDown : revenueIcons.trendUp;
  if (label) label.textContent = `${isDecrease ? "-" : "+"}${Math.abs(Math.round(trend))}% vs yesterday`;
}

function revenueDailyDelivered(offset) {
  const day = revenueStartOfDay(offset);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return revenueDeliveredOrders().filter(order => {
    const date = revenueOrderDate(order);
    return Boolean(date && date >= day && date <= end);
  });
}

function revenueWeeklySeries() {
  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 6;
    const date = revenueStartOfDay(offset);
    const orders = revenueDailyDelivered(offset);
    return {
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue: revenueSum(orders),
      orders: orders.length
    };
  });
}

function revenueRenderCards() {
  const todayOrders = revenueDailyDelivered(0);
  const yesterdayOrders = revenueDailyDelivered(-1);
  const weeklyOrders = revenueDeliveredOrders().filter(order => revenueInLastDays(order, 7));
  const previousWeekOrders = revenueDeliveredOrders().filter(order => {
    const date = revenueOrderDate(order);
    return Boolean(date && date >= revenueStartOfDay(-13) && date < revenueStartOfDay(-6));
  });
  const todayRevenue = revenueSum(todayOrders);
  const yesterdayRevenue = revenueSum(yesterdayOrders);
  const weeklyRevenue = revenueSum(weeklyOrders);
  const previousWeekRevenue = revenueSum(previousWeekOrders);
  const avgOrder = todayOrders.length ? todayRevenue / todayOrders.length : 0;
  const yesterdayAvg = yesterdayOrders.length ? yesterdayRevenue / yesterdayOrders.length : 0;
  const targetProgress = Math.min(Math.round((todayRevenue / REVENUE_TARGET) * 100), 100);
  const toGo = Math.max(REVENUE_TARGET - todayRevenue, 0);

  revenueSetText("revenueDeliveredValue", revenueCurrency(todayRevenue));
  revenueSetText("revenueDeliveredDetail", `${targetProgress}% of ${revenueCurrency(REVENUE_TARGET)} target`);
  revenueSetText("avgOrderValue", revenueCurrency(avgOrder));
  revenueSetText("weeklyRevenueValue", revenueCurrency(weeklyRevenue));
  revenueSetText("targetProgressValue", `${targetProgress}%`);
  revenueSetText("targetProgressDetail", `${revenueCurrency(toGo)} to go`);
  revenueRenderTrend("revenueDeliveredTrend", todayRevenue, yesterdayRevenue);
  revenueRenderTrend("avgOrderTrend", avgOrder, yesterdayAvg);
  revenueRenderTrend("weeklyRevenueTrend", weeklyRevenue, previousWeekRevenue);
}

function revenueRenderWeeklyChart() {
  const chart = document.getElementById("revenueWeekChart");
  const scale = document.getElementById("revenueWeekScale");
  const labels = document.getElementById("revenueWeekLabels");
  if (!chart) return;

  const series = revenueWeeklySeries();
  const max = Math.max(...series.map(day => day.revenue), 1);
  const axisMax = Math.max(1000, Math.ceil(max / 4 / 1000) * 4000);
  const points = series.map((day, index) => {
    const x = series.length === 1 ? 0 : (index / (series.length - 1)) * 100;
    const y = 100 - ((day.revenue / axisMax) * 100);
    return `${x},${y}`;
  }).join(" ");

  if (scale) {
    scale.innerHTML = [axisMax, axisMax * 0.75, axisMax * 0.5, axisMax * 0.25, 0]
      .map(value => `<span>${revenueCurrencyShort(value)}</span>`)
      .join("");
  }
  if (labels) {
    labels.style.setProperty("--label-count", series.length);
    labels.innerHTML = series.map(day => `<span>${day.label}</span>`).join("");
  }

  chart.innerHTML = `
    <svg class="revenue-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="revenueWeekFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#cf6540" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#cf6540" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="0,100 ${points} 100,100" fill="url(#revenueWeekFill)"></polygon>
      <polyline points="${points}" fill="none" stroke="#cf6540" stroke-width="1.2" vector-effect="non-scaling-stroke"></polyline>
    </svg>
  `;
}

function revenueCategoryTotals() {
  const totals = new Map([["Milk", 0], ["Curd", 0], ["Paneer", 0], ["Ghee", 0], ["Other", 0]]);
  revenueDeliveredOrders().filter(revenueIsToday).forEach(order => {
    order.items.forEach(item => {
      const category = revenueCategory(item.name);
      totals.set(category, (totals.get(category) || 0) + revenueItemValue(item));
    });
  });
  return [...totals.entries()];
}

function revenueRenderCategoryChart() {
  const chart = document.getElementById("revenueCategoryChart");
  const scale = document.getElementById("revenueCategoryScale");
  if (!chart) return;

  const rows = revenueCategoryTotals();
  const max = Math.max(...rows.map(([, value]) => value), 1);
  const axisMax = Math.max(1000, Math.ceil(max / 4 / 1000) * 4000);

  if (scale) {
    scale.innerHTML = [axisMax, axisMax * 0.75, axisMax * 0.5, axisMax * 0.25, 0]
      .map(value => `<span>${revenueCurrencyShort(value)}</span>`)
      .join("");
  }

  chart.innerHTML = rows.map(([label, value]) => {
    const height = Math.max((value / axisMax) * 100, value > 0 ? 6 : 0);
    return `
      <div class="revenue-bar-cell">
        <span class="revenue-bar" title="${revenueCurrency(value)}" style="height:${height}%"></span>
        <span class="revenue-bar-label">${revenueEscape(label)}</span>
      </div>
    `;
  }).join("");
}

function revenueRenderAreaList() {
  const list = document.getElementById("revenueAreaList");
  if (!list) return;

  const totals = new Map();
  revenueDeliveredOrders().forEach(order => {
    const area = revenueArea(order);
    totals.set(area, (totals.get(area) || 0) + order.totalAmount);
  });
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...rows.map(([, value]) => value), 1);

  if (!rows.length) {
    list.innerHTML = '<p class="page-note">No delivered area revenue stored yet.</p>';
    return;
  }

  list.innerHTML = rows.map(([area, value]) => {
    const percent = Math.round((value / max) * 100);
    return `
      <div class="revenue-area-row">
        <div class="revenue-area-top">
          <span>${revenueEscape(area)}</span>
          <strong>${revenueCurrency(value)}</strong>
        </div>
        <div class="revenue-area-track" aria-hidden="true">
          <span class="revenue-area-fill" style="--area-width:${percent}%"></span>
        </div>
      </div>
    `;
  }).join("");
}

function revenueRenderDailyTable() {
  const body = document.getElementById("revenueDailyRows");
  if (!body) return;

  const rows = revenueWeeklySeries();
  body.innerHTML = rows.map(day => {
    const avg = day.orders ? day.revenue / day.orders : 0;
    return `
      <tr>
        <td>${revenueEscape(day.label)}</td>
        <td>${day.orders.toLocaleString("en-IN")}</td>
        <td><strong>${revenueCurrency(day.revenue)}</strong></td>
        <td>${revenueCurrency(avg)}</td>
      </tr>
    `;
  }).join("");
}

function revenueRender() {
  revenueRenderCards();
  revenueRenderWeeklyChart();
  revenueRenderCategoryChart();
  revenueRenderAreaList();
  revenueRenderDailyTable();
}

async function revenueLoadOrders() {
  const sb = window.supabaseClient;
  if (!sb) throw new Error("Supabase connection missing.");

  const { data, error } = await sb
    .from("orders")
    .select("*, order_items (*)")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const userIds = [...new Set((data || []).map(order => order.user_id).filter(Boolean))];
  const profilesById = new Map();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await sb
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (!profileError) {
      (profiles || []).forEach(profile => profilesById.set(profile.id, profile));
    }
  }

  revenueOrders = (data || []).map(order => revenueNormalizeOrder({
    ...order,
    profile: profilesById.get(order.user_id) || {}
  }));
  revenueRender();
}

function revenueBuildPage(app) {
  app.innerHTML = `
    <section class="revenue-dashboard">
      <section class="stats-grid" aria-label="Revenue metrics">
        <article class="stat-card">
          <div class="stat-heading">
            <span>REVENUE DELIVERED</span>
            <span class="stat-icon" data-revenue-icon="revenue" aria-hidden="true"></span>
          </div>
          <strong id="revenueDeliveredValue">Rs. 0</strong>
          <span class="stat-detail" id="revenueDeliveredDetail">0% of target</span>
          <span class="stat-trend" id="revenueDeliveredTrend"><span class="trend-icon" aria-hidden="true"></span><span>0% vs yesterday</span></span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>AVG ORDER VALUE</span>
            <span class="stat-icon" data-revenue-icon="wallet" aria-hidden="true"></span>
          </div>
          <strong id="avgOrderValue">Rs. 0</strong>
          <span class="stat-detail">Per delivered order</span>
          <span class="stat-trend" id="avgOrderTrend"><span class="trend-icon" aria-hidden="true"></span><span>0% vs yesterday</span></span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>WEEKLY REVENUE</span>
            <span class="stat-icon" data-revenue-icon="trendUp" aria-hidden="true"></span>
          </div>
          <strong id="weeklyRevenueValue">Rs. 0</strong>
          <span class="stat-detail">Rolling 7 days</span>
          <span class="stat-trend" id="weeklyRevenueTrend"><span class="trend-icon" aria-hidden="true"></span><span>0% vs yesterday</span></span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>TARGET PROGRESS</span>
            <span class="stat-icon" data-revenue-icon="target" aria-hidden="true"></span>
          </div>
          <strong id="targetProgressValue">0%</strong>
          <span class="stat-detail" id="targetProgressDetail">Rs. 0 to go</span>
        </article>
      </section>

      <section class="revenue-panel">
        <div class="revenue-section-head">
          <h2>Revenue this week</h2>
          <p>Delivered order value, last 7 days</p>
        </div>
        <div class="revenue-line-frame">
          <div class="revenue-scale" id="revenueWeekScale" aria-hidden="true"></div>
          <div>
            <div class="revenue-line-chart" id="revenueWeekChart" aria-label="Revenue this week"></div>
            <div class="revenue-chart-labels" id="revenueWeekLabels" aria-hidden="true"></div>
          </div>
        </div>
      </section>

      <section class="revenue-split-grid">
        <article class="revenue-panel">
          <div class="revenue-section-head">
            <h2>By product category</h2>
            <p>Today's split</p>
          </div>
          <div class="revenue-bar-frame">
            <div class="revenue-scale" id="revenueCategoryScale" aria-hidden="true"></div>
            <div class="revenue-bar-chart" id="revenueCategoryChart" aria-label="Revenue by product category"></div>
          </div>
        </article>

        <article class="revenue-panel">
          <div class="revenue-section-head">
            <h2>By area</h2>
            <p>Where the money's flowing in</p>
          </div>
          <div class="revenue-area-list" id="revenueAreaList"></div>
        </article>
      </section>

      <section class="revenue-panel">
        <div class="revenue-section-head">
          <h2>Daily breakdown</h2>
        </div>
        <div class="revenue-table-wrap">
          <table class="revenue-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Orders delivered</th>
                <th>Revenue</th>
                <th>Avg order</th>
              </tr>
            </thead>
            <tbody id="revenueDailyRows"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

  revenueRenderIcons();
}

AdminPages.mount({
  key: "revenue",
  title: "Revenue",
  copy: "What's actually landed in the bank from today's deliveries.",
  status: "Revenue live"
}, app => {
  revenueBuildPage(app);
  revenueLoadOrders().catch(error => {
    console.log(error);
    revenueRender();
  });

  window.supabaseClient
    ?.channel("jfam-revenue-orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => revenueLoadOrders())
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => revenueLoadOrders())
    .subscribe();
});
