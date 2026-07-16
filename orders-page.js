const deliveredIcons = {
  delivered: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
  truck: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v10H3zM14 11h4l3 3v3h-7z"/><path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
  clock: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
  alert: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 9v4M12 17h.01"/></svg>',
  trendUp: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l5-5 4 4 7-7"/><path d="M15 8h5v5"/></svg>'
};

let deliveredOrders = [];

function deliveredEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function deliveredCurrency(value) {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function deliveredDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function deliveredTime(value) {
  const date = deliveredDate(value);
  if (!date) return "-";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function deliveredTodayStart() {
  const date = new Date();
  date.setHours(5, 0, 0, 0);
  return date;
}

function deliveredTodayEnd() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function deliveredIsToday(order) {
  const date = deliveredDate(order.orderedAt);
  return Boolean(date && date >= deliveredTodayStart() && date <= deliveredTodayEnd());
}

function deliveredStatusKey(status) {
  const clean = String(status || "").toLowerCase();
  if (clean.includes("deliver") && !clean.includes("out")) return "delivered";
  if (clean.includes("out")) return "out";
  if (clean.includes("cancel") || clean.includes("fail")) return "failed";
  return "pending";
}

function deliveredStatusLabel(key) {
  return {
    delivered: "Delivered",
    out: "Out for delivery",
    pending: "Pending",
    failed: "Failed"
  }[key] || "Pending";
}

function deliveredStatusBadge(key) {
  return {
    delivered: "delivered",
    out: "out",
    pending: "preparing",
    failed: "cancelled"
  }[key] || "preparing";
}

function deliveredNormalizeOrder(row) {
  const profile = row.profile || {};
  return {
    id: row.id,
    userId: row.user_id,
    orderedAt: row.updated_at || row.ordered_at,
    originalOrderedAt: row.ordered_at,
    status: row.status || "Confirmed",
    totalAmount: Number(row.total_amount) || 0,
    customerName: profile.name || "Customer",
    customerMobile: profile.mobile || "",
    area: row.area || row.address_area || row.delivery_area || row.shipping_area || row.locality || row.city || row.pincode || profile.area || profile.address_area || profile.delivery_area || profile.locality || profile.city || profile.pincode || profile.address || "Area not stored",
    partner: row.partner || row.delivery_partner || row.partner_name || row.rider || row.rider_name || row.delivery_boy || row.assigned_to || "-",
    items: (Array.isArray(row.order_items) ? row.order_items : []).map(item => ({
      name: item.product_name || "Item",
      quantity: item.quantity || "",
      packets: Number(item.packets) || 1
    }))
  };
}

function deliveredTodaysOrders() {
  return deliveredOrders
    .filter(deliveredIsToday)
    .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
}

function deliveredOrdersUpToNow() {
  const now = new Date();
  return deliveredOrders
    .filter(order => {
      const date = deliveredDate(order.orderedAt);
      return Boolean(date && date <= now);
    })
    .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
}

function deliveredCounts(orders) {
  return orders.reduce((counts, order) => {
    counts[deliveredStatusKey(order.status)] += 1;
    return counts;
  }, { delivered: 0, out: 0, pending: 0, failed: 0 });
}

function deliveredRenderIcons() {
  document.querySelectorAll("[data-delivered-icon]").forEach(icon => {
    icon.innerHTML = deliveredIcons[icon.dataset.deliveredIcon] || deliveredIcons.delivered;
  });
  document.querySelectorAll(".trend-icon").forEach(icon => {
    icon.innerHTML = deliveredIcons.trendUp;
  });
}

function deliveredSetText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function deliveredRenderStats(orders) {
  const counts = deliveredCounts(orders);
  const activeTotal = counts.delivered + counts.out + counts.pending + counts.failed;
  const confirmedTotal = Math.max(activeTotal, 1);
  const completion = Math.round((counts.delivered / confirmedTotal) * 100);
  const revenue = orders
    .filter(order => deliveredStatusKey(order.status) === "delivered")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  deliveredSetText("deliveredCount", counts.delivered.toLocaleString("en-IN"));
  deliveredSetText("outCount", counts.out.toLocaleString("en-IN"));
  deliveredSetText("pendingCount", counts.pending.toLocaleString("en-IN"));
  deliveredSetText("failedCount", counts.failed.toLocaleString("en-IN"));
  deliveredSetText("deliveredDetail", `${completion}% of confirmed`);
  deliveredSetText("outDetail", "On partner routes now");
  deliveredSetText("pendingDetail", "Still to leave the hub");
  deliveredSetText("failedDetail", "Need rescheduling");
  deliveredSetText("completionValue", `${completion}%`);
  deliveredSetText("deliveredRevenueValue", `${deliveredCurrency(revenue)} in delivered value so far.`);

  const donut = document.getElementById("statusDonut");
  if (donut) {
    const deliveredEnd = (counts.delivered / confirmedTotal) * 100;
    const outEnd = deliveredEnd + (counts.out / confirmedTotal) * 100;
    const pendingEnd = outEnd + (counts.pending / confirmedTotal) * 100;
    const failedEnd = 100;
    donut.style.setProperty("--delivered-end", `${deliveredEnd}%`);
    donut.style.setProperty("--out-end", `${outEnd}%`);
    donut.style.setProperty("--pending-end", `${pendingEnd}%`);
    donut.style.setProperty("--failed-end", `${failedEnd}%`);
  }

  const progress = document.getElementById("completionFill");
  if (progress) progress.style.setProperty("--completion-width", `${completion}%`);
}

function deliveredHourLabel(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const cleanHour = hour % 12 || 12;
  return `${cleanHour} ${suffix}`;
}

function deliveredRenderLineChart(orders) {
  const chart = document.getElementById("deliveriesLineChart");
  const scale = document.getElementById("deliveriesLineScale");
  const labels = document.getElementById("deliveriesLineLabels");
  if (!chart) return;

  const hours = [5, 6, 7, 8, 9];
  let cumulative = 0;
  const values = hours.map(hour => {
    cumulative += orders.filter(order => {
      const date = deliveredDate(order.orderedAt);
      return deliveredStatusKey(order.status) === "delivered" && date && date.getHours() === hour;
    }).length;
    return cumulative;
  });
  const max = Math.max(...values, 1);
  const axisMax = Math.max(4, Math.ceil(max / 4) * 4);
  const points = values.map((value, index) => {
    const x = hours.length === 1 ? 0 : (index / (hours.length - 1)) * 100;
    const y = 100 - ((value / axisMax) * 100);
    return `${x},${y}`;
  }).join(" ");

  if (scale) {
    scale.innerHTML = [axisMax, axisMax * 0.75, axisMax * 0.5, axisMax * 0.25, 0]
      .map(value => `<span>${Math.round(value)}</span>`)
      .join("");
  }
  if (labels) {
    labels.innerHTML = hours.map(hour => `<span>${deliveredHourLabel(hour)}</span>`).join("");
  }

  chart.innerHTML = `
    <svg class="delivered-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="deliveredLineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6ca56a" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#6ca56a" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="0,100 ${points} 100,100" fill="url(#deliveredLineFill)"></polygon>
      <polyline points="${points}" fill="none" stroke="#4f8f55" stroke-width="1.2" vector-effect="non-scaling-stroke"></polyline>
    </svg>
  `;
}

function deliveredRenderLog(orders) {
  const body = document.getElementById("deliveryLogRows");
  const summary = document.getElementById("deliveryLogSummary");
  if (!body) return;
  if (summary) summary.textContent = `${orders.length.toLocaleString("en-IN")} delivery records from Supabase.`;

  if (!orders.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty-state">No delivery records found for today.</td></tr>';
    return;
  }

  body.innerHTML = orders.map(order => {
    const key = deliveredStatusKey(order.status);
    return `
      <tr>
        <td>${deliveredEscape(order.id)}</td>
        <td>${deliveredEscape(deliveredTime(order.orderedAt))}</td>
        <td>${deliveredEscape(order.customerName)}${order.customerMobile ? `<br><span class="page-note">${deliveredEscape(order.customerMobile)}</span>` : ""}</td>
        <td>${deliveredEscape(order.area)}</td>
        <td>${deliveredEscape(order.partner)}</td>
        <td><strong>${deliveredCurrency(order.totalAmount)}</strong></td>
        <td><span class="badge ${deliveredStatusBadge(key)}">${deliveredStatusLabel(key)}</span></td>
      </tr>
    `;
  }).join("");
}

function deliveredRender() {
  const orders = deliveredTodaysOrders();
  deliveredRenderStats(orders);
  deliveredRenderLineChart(orders);
  deliveredRenderLog(deliveredOrdersUpToNow());
}

async function deliveredLoadOrders() {
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

  deliveredOrders = (data || []).map(order => deliveredNormalizeOrder({
    ...order,
    profile: profilesById.get(order.user_id) || {}
  }));
  deliveredRender();
}

function deliveredBuildPage(app) {
  app.innerHTML = `
    <section class="delivered-dashboard">
      <section class="stats-grid" aria-label="Delivery metrics">
        <article class="stat-card">
          <div class="stat-heading">
            <span>DELIVERED</span>
            <span class="stat-icon" data-delivered-icon="delivered" aria-hidden="true"></span>
          </div>
          <strong id="deliveredCount">0</strong>
          <span class="stat-detail" id="deliveredDetail">0% of confirmed</span>
          <span class="stat-trend"><span class="trend-icon" aria-hidden="true"></span><span>Live from Supabase</span></span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>OUT FOR DELIVERY</span>
            <span class="stat-icon" data-delivered-icon="truck" aria-hidden="true"></span>
          </div>
          <strong id="outCount">0</strong>
          <span class="stat-detail" id="outDetail">On partner routes now</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>PENDING PICKUP</span>
            <span class="stat-icon" data-delivered-icon="clock" aria-hidden="true"></span>
          </div>
          <strong id="pendingCount">0</strong>
          <span class="stat-detail" id="pendingDetail">Still to leave the hub</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>FAILED</span>
            <span class="stat-icon" data-delivered-icon="alert" aria-hidden="true"></span>
          </div>
          <strong id="failedCount">0</strong>
          <span class="stat-detail" id="failedDetail">Need rescheduling</span>
        </article>
      </section>

      <section class="delivered-analytics-grid">
        <article class="delivered-panel">
          <div class="delivered-section-head">
            <h2>Deliveries by hour</h2>
            <p>Cumulative dropoffs today</p>
          </div>
          <div class="delivered-line-frame">
            <div class="delivered-line-scale" id="deliveriesLineScale" aria-hidden="true"></div>
            <div>
              <div class="delivered-line-chart" id="deliveriesLineChart" aria-label="Deliveries by hour"></div>
              <div class="delivered-line-labels" id="deliveriesLineLabels" aria-hidden="true"></div>
            </div>
          </div>
        </article>

        <article class="delivered-panel">
          <div class="delivered-section-head">
            <h2>Status breakdown</h2>
          </div>
          <div class="delivered-donut-wrap">
            <div class="delivered-donut" id="statusDonut" aria-hidden="true"></div>
            <div class="delivered-completion">
              <div class="delivered-completion-top">
                <span>Completion</span>
                <strong id="completionValue">0%</strong>
              </div>
              <div class="delivered-progress-track" aria-hidden="true">
                <span class="delivered-progress-fill" id="completionFill"></span>
              </div>
              <p class="page-note" id="deliveredRevenueValue">Rs. 0 in delivered value so far.</p>
            </div>
          </div>
        </article>
      </section>

      <section class="delivered-panel">
        <div class="delivered-section-head">
          <h2>Delivery log</h2>
          <p id="deliveryLogSummary">Loading delivery records available up to now.</p>
        </div>
        <div class="delivered-log-table-wrap">
          <table class="delivered-log-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Time</th>
                <th>Customer</th>
                <th>Area</th>
                <th>Partner</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="deliveryLogRows"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

  deliveredRenderIcons();
}

AdminPages.mount({
  key: "delivered",
  title: "Orders delivered today",
  copy: "Marked complete by delivery partners in the field.",
  status: "Delivery in progress"
}, app => {
  deliveredBuildPage(app);
  deliveredLoadOrders().catch(error => {
    console.log(error);
    deliveredRender();
  });

  window.supabaseClient
    ?.channel("jfam-delivered-orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => deliveredLoadOrders())
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => deliveredLoadOrders())
    .subscribe();
});
