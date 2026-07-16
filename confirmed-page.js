const confirmedIcons = {
  confirmed: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 6"/><path d="M4 20h16"/></svg>',
  subscriptions: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3"/><path d="M4 11V8a2 2 0 0 1 2-2h14"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v3a2 2 0 0 1-2 2H4"/></svg>',
  customers: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0"/><path d="M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-5-6"/></svg>',
  products: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>'
};

let confirmedOrders = [];

function confirmedEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function confirmedCurrency(value) {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function confirmedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function confirmedTime(value) {
  const date = confirmedDate(value);
  if (!date) return "-";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function confirmedDateTime(value) {
  const date = confirmedDate(value);
  if (!date) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function confirmedHourLabel(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const cleanHour = hour % 12 || 12;
  return `${cleanHour} ${suffix}`;
}

function confirmedIsSubscriptionItem(item) {
  const plan = String(item.plan || "").toLowerCase();
  return Boolean(plan && !["one time", "once", "single"].includes(plan)) || Boolean(item.startDate || item.endDate);
}

function confirmedIsAddonItem(item) {
  const text = `${item.name} ${item.plan}`.toLowerCase();
  return text.includes("add-on") || text.includes("addon") || text.includes("extra");
}

function confirmedOrderSource(order) {
  if (order.items.some(confirmedIsAddonItem)) return "addOn";
  if (order.items.some(confirmedIsSubscriptionItem)) return "subscription";
  return "oneTime";
}

function confirmedNormalizeOrder(row) {
  const profile = row.profile || {};
  return {
    id: row.id,
    userId: row.user_id,
    orderedAt: row.ordered_at,
    status: row.status || "Confirmed",
    totalAmount: Number(row.total_amount) || 0,
    customerName: profile.name || "Customer",
    customerMobile: profile.mobile || "",
    customerEmail: profile.email || "",
    area: row.area || row.address_area || row.delivery_area || row.shipping_area || row.locality || row.city || row.pincode || profile.area || profile.address_area || profile.delivery_area || profile.locality || profile.city || profile.pincode || profile.address || "Area not stored",
    items: (Array.isArray(row.order_items) ? row.order_items : [])
      .slice()
      .sort((a, b) => Number(a.item_index) - Number(b.item_index))
      .map(item => ({
        name: item.product_name || "Item",
        quantity: item.quantity || "",
        packets: Number(item.packets) || 1,
        plan: item.plan || "",
        startDate: item.start_date || "",
        endDate: item.end_date || ""
      }))
  };
}

function confirmedAllOrders() {
  return confirmedOrders
    .filter(order => {
      return !String(order.status).toLowerCase().includes("cancel");
    })
    .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
}

function confirmedSourceCounts(orders) {
  return orders.reduce((counts, order) => {
    counts[confirmedOrderSource(order)] += 1;
    return counts;
  }, { subscription: 0, oneTime: 0, addOn: 0 });
}

function confirmedSetText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function confirmedRenderIcons() {
  document.querySelectorAll("[data-confirmed-icon]").forEach(icon => {
    icon.innerHTML = confirmedIcons[icon.dataset.confirmedIcon] || confirmedIcons.confirmed;
  });
}

function confirmedRenderStats(orders) {
  const sources = confirmedSourceCounts(orders);
  confirmedSetText("confirmedTodayValue", orders.length.toLocaleString("en-IN"));
  confirmedSetText("confirmedSubscriptionsValue", sources.subscription.toLocaleString("en-IN"));
  confirmedSetText("confirmedOneTimeValue", sources.oneTime.toLocaleString("en-IN"));
  confirmedSetText("confirmedAddonValue", sources.addOn.toLocaleString("en-IN"));
  confirmedSetText("confirmedTodayDetail", "All stored confirmed orders");
  confirmedSetText("confirmedSubscriptionsDetail", "Orders with recurring plan data");
  confirmedSetText("confirmedOneTimeDetail", "Orders without subscription markers");
  confirmedSetText("confirmedAddonDetail", "Orders with add-on item markers");
}

function confirmedRenderChart(orders) {
  const container = document.getElementById("confirmationsChart");
  const scale = document.getElementById("confirmationsChartScale");
  if (!container) return;

  const hourlyCounts = new Map();
  for (let hour = 5; hour <= 9; hour += 1) hourlyCounts.set(hour, 0);

  orders.forEach(order => {
    const date = confirmedDate(order.orderedAt);
    if (!date) return;
    const hour = date.getHours();
    if (hour >= 5 && hour <= 9) {
      hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + 1);
    }
  });

  const max = Math.max(...hourlyCounts.values(), 1);
  const axisMax = Math.max(4, Math.ceil(max / 4) * 4);

  if (scale) {
    scale.innerHTML = [axisMax, axisMax * 0.75, axisMax * 0.5, axisMax * 0.25, 0]
      .map(value => `<span>${Math.round(value)}</span>`)
      .join("");
  }

  container.innerHTML = [...hourlyCounts.entries()].map(([hour, count]) => {
    const height = Math.max((count / axisMax) * 100, count > 0 ? 6 : 0);
    return `
      <div class="confirmed-bar-cell">
        <span class="confirmed-bar" title="${count} orders" style="height:${height}%"></span>
        <span class="confirmed-bar-label">${confirmedHourLabel(hour)}</span>
      </div>
    `;
  }).join("");
}

function confirmedRenderSources(orders) {
  const sources = confirmedSourceCounts(orders);
  const total = Math.max(orders.length, 1);
  const rows = [
    ["Subscription", sources.subscription],
    ["One-time", sources.oneTime],
    ["Add-on", sources.addOn]
  ];

  const list = document.getElementById("confirmedSourceList");
  if (!list) return;

  list.innerHTML = rows.map(([label, value]) => {
    const percent = Math.round((value / total) * 100);
    return `
      <div class="confirmed-source-row">
        <div class="confirmed-source-top">
          <span>${label}</span>
          <strong>${value.toLocaleString("en-IN")}</strong>
          <span>${percent}%</span>
        </div>
        <div class="confirmed-source-track" aria-hidden="true">
          <span class="confirmed-source-fill" style="--source-width:${percent}%"></span>
        </div>
      </div>
    `;
  }).join("");
}

function confirmedRenderOrders(orders) {
  const list = document.getElementById("confirmedOrdersList");
  const summary = document.getElementById("confirmedOrdersSummary");
  if (!list) return;

  if (summary) {
    summary.textContent = `${orders.length.toLocaleString("en-IN")} confirmed orders shown.`;
  }

  if (!orders.length) {
    list.innerHTML = '<div class="empty-state">No confirmed orders found for this date.</div>';
    return;
  }

  list.innerHTML = orders.map(order => {
    const items = order.items.map(item => {
      const detail = [item.quantity, `${item.packets} packet`, item.plan].filter(Boolean).join(" | ");
      return `${confirmedEscape(item.name)}${detail ? ` (${confirmedEscape(detail)})` : ""}`;
    }).join(", ");

    return `
      <article class="confirmed-order-card">
        <div class="confirmed-order-top">
          <div>
            <p class="confirmed-order-title">
              <strong>${confirmedEscape(order.id)}</strong>
              <span class="badge confirmed">${confirmedEscape(order.status)}</span>
            </p>
            <div class="confirmed-order-meta">
              <span>${confirmedEscape(confirmedDateTime(order.orderedAt))}</span>
              <span>${confirmedEscape(order.customerName)}${order.customerMobile ? ` | ${confirmedEscape(order.customerMobile)}` : ""}</span>
              <span>${confirmedEscape(order.area)}</span>
            </div>
          </div>
          <strong class="confirmed-order-amount">${confirmedCurrency(order.totalAmount)}</strong>
        </div>
        <div class="confirmed-items">${items || "No item details stored"}</div>
      </article>
    `;
  }).join("");
}

function confirmedRender() {
  const orders = confirmedAllOrders();
  confirmedRenderStats(orders);
  confirmedRenderChart(orders);
  confirmedRenderSources(orders);
  confirmedRenderOrders(orders);
}

async function confirmedLoadOrders() {
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

  confirmedOrders = (data || []).map(order => confirmedNormalizeOrder({
    ...order,
    profile: profilesById.get(order.user_id) || {}
  }));
  confirmedRender();
}

function confirmedBuildPage(app) {
  app.innerHTML = `
    <section class="confirmed-dashboard">
      <section class="stats-grid" aria-label="Confirmed order metrics">
        <article class="stat-card">
          <div class="stat-heading">
            <span class="stat-icon" data-confirmed-icon="confirmed" aria-hidden="true"></span>
            <span>Confirmed today</span>
          </div>
          <strong id="confirmedTodayValue">0</strong>
          <span class="stat-detail" id="confirmedTodayDetail">Since 5 AM today</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span class="stat-icon" data-confirmed-icon="subscriptions" aria-hidden="true"></span>
            <span>From subscriptions</span>
          </div>
          <strong id="confirmedSubscriptionsValue">0</strong>
          <span class="stat-detail" id="confirmedSubscriptionsDetail">Orders with recurring plan data</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span class="stat-icon" data-confirmed-icon="customers" aria-hidden="true"></span>
            <span>One-time orders</span>
          </div>
          <strong id="confirmedOneTimeValue">0</strong>
          <span class="stat-detail" id="confirmedOneTimeDetail">Orders without subscription markers</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span class="stat-icon" data-confirmed-icon="products" aria-hidden="true"></span>
            <span>Add-ons</span>
          </div>
          <strong id="confirmedAddonValue">0</strong>
          <span class="stat-detail" id="confirmedAddonDetail">Orders with add-on item markers</span>
        </article>
      </section>

      <section class="confirmed-chart-card">
        <div class="confirmed-section-head">
          <h2>Confirmations by hour</h2>
          <p>Order intake through the delivery window</p>
        </div>
        <div class="confirmed-chart-frame">
          <div class="confirmed-chart-scale" id="confirmationsChartScale" aria-hidden="true"></div>
          <div class="confirmed-chart" id="confirmationsChart" aria-label="Confirmations by hour"></div>
        </div>
      </section>

      <section class="confirmed-source-card">
        <div class="confirmed-section-head">
          <h2>Order sources</h2>
          <p>Share of confirmed orders by order type</p>
        </div>
        <div class="confirmed-source-list" id="confirmedSourceList"></div>
      </section>

      <section class="page-panel">
        <div class="confirmed-section-head">
          <h2>All confirmed orders</h2>
          <p>Sorted by most recent</p>
        </div>
        <p class="page-note" id="confirmedOrdersSummary">Loading confirmed orders.</p>
      </section>

      <section class="confirmed-orders-list" id="confirmedOrdersList" aria-label="Confirmed orders"></section>
    </section>
  `;

  confirmedRenderIcons();
}

AdminPages.mount({
  key: "confirmed",
  title: "Orders confirmed today",
  copy: "Every order placed through the customer app since 5 AM.",
  status: "Live from customer app"
}, app => {
  confirmedBuildPage(app);
  confirmedLoadOrders().catch(error => {
    console.log(error);
    confirmedRender();
  });

  window.supabaseClient
    ?.channel("jfam-confirmed-orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => confirmedLoadOrders())
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => confirmedLoadOrders())
    .subscribe();
});
