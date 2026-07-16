const subscriptionIcons = {
  subscriptions: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3"/><path d="M4 11V8a2 2 0 0 1 2-2h14"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v3a2 2 0 0 1-2 2H4"/></svg>',
  customerAdd: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/></svg>',
  pause: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
  churn: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l5 5 4-4 7 7"/><path d="M15 16h5v-5"/></svg>',
  trendUp: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l5-5 4 4 7-7"/><path d="M15 8h5v5"/></svg>',
  trendDown: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l5 5 4-4 7 7"/><path d="M15 16h5v-5"/></svg>'
};

let subscriptionRows = [];

function subEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function subDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function subStartOfDay(offset = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function subIsRecurring(item) {
  const plan = String(item.plan || "").toLowerCase();
  return Boolean(plan && !["one time", "once", "single"].includes(plan)) || Boolean(item.startDate || item.endDate);
}

function subPlanLabel(plan) {
  const clean = String(plan || "").toLowerCase();
  if (clean.includes("alternate")) return "Alternate";
  if (clean.includes("week")) return "Weekly";
  if (clean.includes("daily") || clean.includes("day")) return "Daily";
  return plan || "Daily";
}

function subStatus(row) {
  if (row.cancelled) return "Cancelled";
  if (String(row.orderStatus || "").toLowerCase().includes("cancel")) return "Cancelled";
  if (String(row.plan || "").toLowerCase().includes("pause") || String(row.orderStatus || "").toLowerCase().includes("pause")) return "Paused";
  return "Active";
}

function subIsActive(row) {
  return subStatus(row) === "Active";
}

function subIsPaused(row) {
  return subStatus(row) === "Paused";
}

function subIsCancelled(row) {
  return subStatus(row) === "Cancelled";
}

function subInLastDays(value, days) {
  const date = subDate(value);
  return Boolean(date && date >= subStartOfDay(-(days - 1)) && date <= new Date());
}

function subNextDelivery(row) {
  const start = subDate(row.startDate);
  const end = subDate(row.endDate);
  const now = new Date();
  if (end && end < now) return "Ended";
  const base = start && start > now ? start : new Date(now.getTime() + 86400000);
  const plan = subPlanLabel(row.plan).toLowerCase();
  if (plan === "weekly") {
    base.setDate(base.getDate() + ((7 - base.getDay()) % 7 || 7));
  } else if (plan === "alternate") {
    base.setDate(base.getDate() + 2);
  }
  return base.toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function subSince(row) {
  const date = subDate(row.startDate || row.orderedAt);
  if (!date) return "-";
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function subTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function subSetText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function subRenderTrend(id, current, previous, lowerIsBetter = false) {
  const element = document.getElementById(id);
  if (!element) return;
  const trend = subTrend(current, previous);
  const isDecrease = trend < 0;
  const isGood = lowerIsBetter ? isDecrease || trend === 0 : !isDecrease;
  element.classList.toggle("decrease", !isGood);
  const icon = element.querySelector(".trend-icon");
  const label = element.querySelector("span:last-child");
  if (icon) icon.innerHTML = isDecrease ? subscriptionIcons.trendDown : subscriptionIcons.trendUp;
  if (label) label.textContent = `${isDecrease ? "-" : "+"}${Math.abs(Math.round(trend))}% vs yesterday`;
}

function subRenderIcons() {
  document.querySelectorAll("[data-sub-icon]").forEach(icon => {
    icon.innerHTML = subscriptionIcons[icon.dataset.subIcon] || subscriptionIcons.subscriptions;
  });
}

function subUniqueCustomers(rows) {
  return new Set(rows.map(row => row.userId || row.customerMobile || row.customerName).filter(Boolean)).size;
}

function subPlanMix() {
  const counts = new Map([["Daily", 0], ["Alternate", 0], ["Weekly", 0]]);
  subscriptionRows.filter(subIsActive).forEach(row => {
    const plan = subPlanLabel(row.plan);
    counts.set(plan, (counts.get(plan) || 0) + 1);
  });
  return [...counts.entries()];
}

function subRenderCards() {
  const active = subscriptionRows.filter(subIsActive);
  const paused = subscriptionRows.filter(subIsPaused);
  const cancelled30d = subscriptionRows.filter(row => subIsCancelled(row) && subInLastDays(row.orderedAt, 30));
  const previousCancelledWindow = subscriptionRows.filter(row => {
    const date = subDate(row.orderedAt);
    return Boolean(row && subIsCancelled(row) && date && date >= subStartOfDay(-60) && date < subStartOfDay(-30));
  });
  const newThisWeek = subscriptionRows.filter(row => subInLastDays(row.orderedAt, 7));
  const newYesterdayWindow = subscriptionRows.filter(row => {
    const date = subDate(row.orderedAt);
    return Boolean(date && date >= subStartOfDay(-8) && date < subStartOfDay(-1));
  });
  const churnBase = active.length + cancelled30d.length;
  const churn = churnBase ? (cancelled30d.length / churnBase) * 100 : 0;
  const previousChurnBase = active.length + previousCancelledWindow.length;
  const previousChurn = previousChurnBase ? (previousCancelledWindow.length / previousChurnBase) * 100 : 0;

  subSetText("activeSubscribersValue", subUniqueCustomers(active).toLocaleString("en-IN"));
  subSetText("newThisWeekValue", `+${newThisWeek.length.toLocaleString("en-IN")}`);
  subSetText("pausedPlansValue", paused.length.toLocaleString("en-IN"));
  subSetText("churnValue", `${Math.round(churn * 10) / 10}%`);
  subSetText("activeSubscribersDetail", "Auto-renewing plans");
  subSetText("newThisWeekDetail", "From customer app");
  subSetText("pausedPlansDetail", "Not billing this cycle");
  subSetText("churnDetail", `${cancelled30d.length.toLocaleString("en-IN")} cancelled in stored 30-day window`);
  subRenderTrend("newThisWeekTrend", newThisWeek.length, newYesterdayWindow.length);
  subRenderTrend("churnTrend", churn, previousChurn, true);
}

function subRenderPlanMix() {
  const chart = document.getElementById("subscriptionsPlanChart");
  const scale = document.getElementById("subscriptionsPlanScale");
  if (!chart) return;

  const rows = subPlanMix();
  const max = Math.max(...rows.map(([, value]) => value), 1);
  const axisMax = Math.max(4, Math.ceil(max / 4) * 4);

  if (scale) {
    scale.innerHTML = [axisMax, axisMax * 0.75, axisMax * 0.5, axisMax * 0.25, 0]
      .map(value => `<span>${Math.round(value)}</span>`)
      .join("");
  }

  chart.innerHTML = rows.map(([label, value]) => {
    const height = Math.max((value / axisMax) * 100, value > 0 ? 6 : 0);
    return `
      <div class="subscriptions-bar-cell">
        <span class="subscriptions-bar" title="${value} subscribers" style="height:${height}%"></span>
        <span class="subscriptions-bar-label">${subEscape(label)}</span>
      </div>
    `;
  }).join("");
}

function subRenderHealth() {
  const health = document.getElementById("subscriptionsHealthList");
  if (!health) return;

  const active = subscriptionRows.filter(subIsActive);
  const paused = subscriptionRows.filter(subIsPaused);
  const mix = subPlanMix();
  const total = Math.max(active.length, 1);
  const topPlan = mix.slice().sort((a, b) => b[1] - a[1])[0] || ["Daily", 0];
  const topPlanShare = Math.round((topPlan[1] / total) * 100);
  const paneerAddons = subscriptionRows.filter(row => String(row.product).toLowerCase().includes("paneer")).length;
  const upsellRate = Math.round((paneerAddons / Math.max(subscriptionRows.length, 1)) * 100);

  health.innerHTML = `
    <article class="health-card good">
      <strong>Strong retention</strong>
      <span>${topPlanShare}% of subscribers are on ${subEscape(topPlan[0])} plans - your most sticky segment.</span>
    </article>
    <article class="health-card warn">
      <strong>Watch pauses</strong>
      <span>${paused.length.toLocaleString("en-IN")} of ${subscriptionRows.length.toLocaleString("en-IN")} shown are paused. Follow up before churn.</span>
    </article>
    <article class="health-card good">
      <strong>Upsell moment</strong>
      <span>Paneer subscriptions make up ${upsellRate}% of stored recurring items.</span>
    </article>
  `;
}

function subRenderTable() {
  const body = document.getElementById("subscriptionsRows");
  if (!body) return;

  const rows = subscriptionRows
    .slice()
    .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt))
    .slice(0, 20);

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="8" class="empty-state">No subscriptions stored yet.</td></tr>';
    return;
  }

  body.innerHTML = rows.map(row => {
    const plan = subPlanLabel(row.plan);
    const status = subStatus(row);
    const badgeClass = status === "Active" ? "delivered" : status === "Paused" ? "preparing" : "cancelled";
    const planClass = plan === "Alternate" ? "delivered" : plan === "Weekly" ? "preparing" : "confirmed";
    return `
      <tr>
        <td>${subEscape(row.id)}</td>
        <td>${subEscape(row.customerName)}</td>
        <td>${subEscape(row.product)}</td>
        <td><span class="badge ${planClass}">${subEscape(plan)}</span></td>
        <td>${subEscape(row.quantity || `${row.packets} units`)}</td>
        <td>${subEscape(subNextDelivery(row))}</td>
        <td>${subEscape(subSince(row))}</td>
        <td><span class="badge ${badgeClass}">${subEscape(status)}</span></td>
      </tr>
    `;
  }).join("");
}

function subRender() {
  subRenderCards();
  subRenderPlanMix();
  subRenderHealth();
  subRenderTable();
}

function subNormalizeOrder(row) {
  const profile = row.profile || {};
  return (Array.isArray(row.order_items) ? row.order_items : [])
    .filter(item => subIsRecurring({
      plan: item.plan,
      startDate: item.start_date,
      endDate: item.end_date
    }))
    .map((item, index) => ({
      id: item.id || `SUB-${String(row.id).slice(-5)}-${index + 1}`,
      orderId: row.id,
      userId: row.user_id,
      orderedAt: row.ordered_at,
      orderStatus: row.status || "Confirmed",
      customerName: profile.name || "Customer",
      customerMobile: profile.mobile || "",
      product: item.product_name || "Item",
      plan: item.plan || "Daily",
      quantity: item.quantity || "",
      packets: Number(item.packets) || 1,
      startDate: item.start_date || row.ordered_at,
      endDate: item.end_date || "",
      cancelled: Boolean(item.cancelled)
    }));
}

async function subLoadSubscriptions() {
  const sb = window.supabaseClient;
  if (!sb) throw new Error("Supabase connection missing.");

  const { data, error } = await sb
    .from("orders")
    .select("*, order_items (*)")
    .order("ordered_at", { ascending: false });

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

  subscriptionRows = (data || []).flatMap(order => subNormalizeOrder({
    ...order,
    profile: profilesById.get(order.user_id) || {}
  }));
  subRender();
}

function subBuildPage(app) {
  app.innerHTML = `
    <section class="subscriptions-dashboard">
      <section class="stats-grid" aria-label="Subscription metrics">
        <article class="stat-card">
          <div class="stat-heading">
            <span>ACTIVE SUBSCRIBERS</span>
            <span class="stat-icon" data-sub-icon="subscriptions" aria-hidden="true"></span>
          </div>
          <strong id="activeSubscribersValue">0</strong>
          <span class="stat-detail" id="activeSubscribersDetail">Auto-renewing plans</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>NEW THIS WEEK</span>
            <span class="stat-icon" data-sub-icon="customerAdd" aria-hidden="true"></span>
          </div>
          <strong id="newThisWeekValue">+0</strong>
          <span class="stat-detail" id="newThisWeekDetail">From customer app</span>
          <span class="stat-trend" id="newThisWeekTrend"><span class="trend-icon" aria-hidden="true"></span><span>+0% vs yesterday</span></span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>PAUSED PLANS</span>
            <span class="stat-icon" data-sub-icon="pause" aria-hidden="true"></span>
          </div>
          <strong id="pausedPlansValue">0</strong>
          <span class="stat-detail" id="pausedPlansDetail">Not billing this cycle</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>CHURN (30D)</span>
            <span class="stat-icon" data-sub-icon="churn" aria-hidden="true"></span>
          </div>
          <strong id="churnValue">0%</strong>
          <span class="stat-detail" id="churnDetail">Stored 30-day cancellation rate</span>
          <span class="stat-trend" id="churnTrend"><span class="trend-icon" aria-hidden="true"></span><span>+0% vs yesterday</span></span>
        </article>
      </section>

      <section class="subscriptions-main-grid">
        <article class="subscriptions-panel">
          <div class="subscriptions-section-head">
            <h2>Plan mix</h2>
            <p>Active subscribers per plan</p>
          </div>
          <div class="subscriptions-bar-frame">
            <div class="subscriptions-scale" id="subscriptionsPlanScale" aria-hidden="true"></div>
            <div class="subscriptions-bar-chart" id="subscriptionsPlanChart" aria-label="Plan mix"></div>
          </div>
        </article>

        <article class="subscriptions-panel">
          <div class="subscriptions-section-head">
            <h2>Health check</h2>
          </div>
          <div class="health-list" id="subscriptionsHealthList"></div>
        </article>
      </section>

      <section class="subscriptions-panel">
        <div class="subscriptions-section-head">
          <h2>Recent subscriptions</h2>
        </div>
        <div class="subscriptions-table-wrap">
          <table class="subscriptions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Plan</th>
                <th>Quantity</th>
                <th>Next delivery</th>
                <th>Since</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="subscriptionsRows"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

  subRenderIcons();
}

AdminPages.mount({
  key: "subscriptions",
  title: "Subscriptions",
  copy: "Recurring plans powering daily deliveries.",
  status: "Subscription live"
}, app => {
  subBuildPage(app);
  subLoadSubscriptions().catch(error => {
    console.log(error);
    subRender();
  });

  window.supabaseClient
    ?.channel("jfam-subscriptions")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => subLoadSubscriptions())
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => subLoadSubscriptions())
    .subscribe();
});
