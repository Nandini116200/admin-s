const deliveryIcons = {
  partner: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0"/><path d="M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-5-6"/></svg>',
  route: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 23a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M5 7c0 7 14 3 14 10"/></svg>',
  clock: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>'
};

let deliveryRows = [];

function deliveryEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function deliveryDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function deliveryTodayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function deliveryIsToday(value) {
  const date = deliveryDate(value);
  const start = deliveryTodayStart();
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return Boolean(date && date >= start && date <= end);
}

function deliveryCurrency(value) {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function deliveryStatusKey(status) {
  const clean = String(status || "").toLowerCase();
  if (clean.includes("deliver") && !clean.includes("out")) return "delivered";
  if (clean.includes("out")) return "open";
  if (clean.includes("cancel") || clean.includes("fail")) return "issue";
  return "pending";
}

function deliveryPartner(row) {
  return row.partner || row.delivery_partner || row.partner_name || row.rider || row.rider_name || row.delivery_boy || row.assigned_to || "Unassigned";
}

function deliveryArea(row, profile = {}) {
  return row.area || row.address_area || row.delivery_area || row.shipping_area || row.locality || row.city || row.pincode
    || profile.area || profile.address_area || profile.delivery_area || profile.locality || profile.city || profile.pincode || profile.address
    || "Area not stored";
}

function deliveryNormalizeOrder(row) {
  const profile = row.profile || {};
  const items = Array.isArray(row.order_items) ? row.order_items : [];
  return {
    id: row.id,
    status: row.status || "Confirmed",
    orderedAt: row.ordered_at,
    updatedAt: row.updated_at || row.ordered_at,
    partner: deliveryPartner(row),
    route: deliveryArea(row, profile),
    customer: profile.name || "Customer",
    mobile: profile.mobile || "",
    amount: window.JFAMPricing?.orderTotal(row) ?? Number(row.total_amount) ?? 0,
    items: items.map(item => item.product_name || "Item").filter(Boolean)
  };
}

function deliveryTodaysRows() {
  return deliveryRows
    .filter(row => deliveryIsToday(row.orderedAt) || deliveryIsToday(row.updatedAt))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function deliveryFilteredRows() {
  const query = (document.getElementById("routeSearch")?.value || "").trim().toLowerCase();
  const zone = document.getElementById("routeZone")?.value || "All";
  return deliveryTodaysRows().filter(row => {
    const haystack = [row.route, row.partner, row.status, row.customer, row.mobile, row.id].join(" ").toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesZone = zone === "All" || row.route.toLowerCase().includes(zone.toLowerCase());
    return matchesSearch && matchesZone;
  });
}

function deliverySetText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function deliveryRenderIcons() {
  document.querySelectorAll("[data-delivery-icon]").forEach(icon => {
    icon.innerHTML = deliveryIcons[icon.dataset.deliveryIcon] || deliveryIcons.route;
  });
}

function deliveryRenderStats(rows) {
  const activePartners = new Set(rows.map(row => row.partner).filter(partner => partner && partner !== "Unassigned")).size;
  const openRoutes = rows.filter(row => ["open", "pending"].includes(deliveryStatusKey(row.status))).length;
  const delivered = rows.filter(row => deliveryStatusKey(row.status) === "delivered").length;
  const onTimeRate = rows.length ? Math.round((delivered / rows.length) * 100) : 0;

  deliverySetText("deliveryActivePartners", activePartners.toLocaleString("en-IN"));
  deliverySetText("deliveryOpenRoutes", openRoutes.toLocaleString("en-IN"));
  deliverySetText("deliveryOnTimeRate", `${onTimeRate}%`);
  deliverySetText("deliveryRouteSummary", `${rows.length.toLocaleString("en-IN")} live rows from customer orders.`);
}

function deliveryRenderTable(rows) {
  const body = document.getElementById("deliveryRouteRows");
  if (!body) return;

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty-state">No live routes found for this filter.</td></tr>';
    return;
  }

  body.innerHTML = rows.map(row => {
    const statusKey = deliveryStatusKey(row.status);
    const badge = statusKey === "delivered" ? "delivered" : statusKey === "issue" ? "cancelled" : statusKey === "open" ? "out" : "preparing";
    return `
      <tr>
        <td>${deliveryEscape(row.route)}</td>
        <td>${deliveryEscape(row.partner)}</td>
        <td>${deliveryEscape(row.customer)}${row.mobile ? `<br><span class="page-note">${deliveryEscape(row.mobile)}</span>` : ""}</td>
        <td>${deliveryEscape(row.items.slice(0, 3).join(", ") || "Items not stored")}</td>
        <td><strong>${deliveryCurrency(row.amount)}</strong></td>
        <td><span class="badge ${badge}">${deliveryEscape(row.status)}</span></td>
      </tr>
    `;
  }).join("");
}

function deliveryRender() {
  const rows = deliveryFilteredRows();
  deliveryRenderStats(rows);
  deliveryRenderTable(rows);
}

async function deliveryLoadData() {
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

  deliveryRows = (data || []).map(order => deliveryNormalizeOrder({
    ...order,
    profile: profilesById.get(order.user_id) || {}
  }));
  deliveryRender();
}

function deliveryBuildPage(app) {
  app.innerHTML = `
    <section class="delivery-dashboard">
      <section class="stats-grid" aria-label="Delivery partner metrics">
        <article class="stat-card">
          <div class="stat-heading">
            <span>Active partners</span>
            <span class="stat-icon" data-delivery-icon="partner" aria-hidden="true"></span>
          </div>
          <strong id="deliveryActivePartners">0</strong>
          <span class="stat-detail">Assigned from order rows</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>Open routes</span>
            <span class="stat-icon" data-delivery-icon="route" aria-hidden="true"></span>
          </div>
          <strong id="deliveryOpenRoutes">0</strong>
          <span class="stat-detail">Pending or out for delivery</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>Completion rate</span>
            <span class="stat-icon" data-delivery-icon="clock" aria-hidden="true"></span>
          </div>
          <strong id="deliveryOnTimeRate">0%</strong>
          <span class="stat-detail">Delivered share today</span>
        </article>
      </section>

      <section class="page-panel">
        <h2>Route controls</h2>
        <div class="page-control-bar">
          <input id="routeSearch" type="search" placeholder="Search partner, area, customer">
          <select id="routeZone">
            <option value="All">All areas</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="Central">Central</option>
            <option value="Area not stored">Area not stored</option>
          </select>
        </div>
        <p class="page-note" id="deliveryRouteSummary">Loading live routes from Supabase.</p>
      </section>

      <section class="page-panel">
        <div class="page-table-wrap">
          <table class="page-table">
            <thead>
              <tr>
                <th>Route / area</th>
                <th>Partner</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="deliveryRouteRows"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

  deliveryRenderIcons();
  document.getElementById("routeSearch")?.addEventListener("input", deliveryRender);
  document.getElementById("routeZone")?.addEventListener("change", deliveryRender);
}

AdminPages.mount({
  key: "delivery",
  title: "Delivery Partners",
  copy: "Route-by-route performance from live customer orders.",
  status: "Live from orders"
}, app => {
  deliveryBuildPage(app);
  deliveryLoadData().catch(error => {
    console.log(error);
    deliveryRender();
  });

  window.supabaseClient
    ?.channel("jfam-delivery-routes")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => deliveryLoadData())
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => deliveryLoadData())
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => deliveryLoadData())
    .subscribe();
});
