const customerIcons = {
  customers: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0"/><path d="M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-5-6"/></svg>',
  heart: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8a5 5 0 0 0-8-3 5 5 0 0 0-8 3c0 6 8 11 8 11s8-5 8-11z"/></svg>',
  churn: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h11"/><path d="M12 8l4 4-4 4"/><path d="M20 5v14"/></svg>',
  revenue: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10M7 9h10M9 5c4 0 6 2 6 5s-2 5-6 5l6 4"/></svg>',
  search: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'
};

let customerRows = [];

function customerEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function customerCurrency(value) {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function customerDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function customerSince(value) {
  const date = customerDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function customerIsDelivered(order) {
  const status = String(order.status || "").toLowerCase();
  return status.includes("deliver") && !status.includes("out");
}

function customerIsCancelled(order) {
  return String(order.status || "").toLowerCase().includes("cancel");
}

function customerIsSubscriptionItem(item) {
  const plan = String(item.plan || "").toLowerCase();
  return Boolean(plan && !["one time", "once", "single"].includes(plan)) || Boolean(item.startDate || item.endDate);
}

function customerKey(order) {
  return order.user_id || order.profile?.mobile || order.profile?.email || order.id;
}

function customerArea(profile, order) {
  return order.area || order.address_area || order.delivery_area || order.shipping_area || order.locality || order.city || order.pincode || profile.area || profile.address_area || profile.delivery_area || profile.locality || profile.city || profile.pincode || profile.address || "Area not stored";
}

function customerStatus(row) {
  if (row.hasActiveSubscription) return "Subscribed";
  if (row.hasCancelledSubscription || row.cancelledOrders > 0) return "Churned";
  return "One-time";
}

function customerStatusBadge(status) {
  if (status === "Subscribed") return "delivered";
  if (status === "Churned") return "cancelled";
  return "confirmed";
}

function customerRenderIcons() {
  document.querySelectorAll("[data-customer-icon]").forEach(icon => {
    icon.innerHTML = customerIcons[icon.dataset.customerIcon] || customerIcons.customers;
  });
  document.querySelectorAll("[data-customer-search-icon]").forEach(icon => {
    icon.innerHTML = customerIcons.search;
  });
}

function customerSetText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function customerFilteredRows() {
  const query = (document.getElementById("customerSearch")?.value || "").trim().toLowerCase();
  if (!query) return customerRows;
  return customerRows.filter(row => [
    row.id,
    row.name,
    row.mobile,
    row.email,
    row.area,
    customerStatus(row)
  ].join(" ").toLowerCase().includes(query));
}

function customerRenderCards() {
  const total = customerRows.length;
  const subscribed = customerRows.filter(row => customerStatus(row) === "Subscribed").length;
  const churned = customerRows.filter(row => customerStatus(row) === "Churned").length;
  const ltv = customerRows.reduce((sum, row) => sum + row.ltv, 0);
  const subscribedShare = total ? Math.round((subscribed / total) * 100) : 0;

  customerSetText("totalCustomersValue", total.toLocaleString("en-IN"));
  customerSetText("subscribedCustomersValue", subscribed.toLocaleString("en-IN"));
  customerSetText("churnedCustomersValue", churned.toLocaleString("en-IN"));
  customerSetText("totalLtvValue", customerCurrency(ltv));
  customerSetText("totalCustomersDetail", "Lifetime");
  customerSetText("subscribedCustomersDetail", `${subscribedShare}% of base`);
  customerSetText("churnedCustomersDetail", "Win back campaigns");
  customerSetText("totalLtvDetail", "Sum of lifetime value");
}

function customerRenderTable() {
  const body = document.getElementById("customerRows");
  const summary = document.getElementById("customerSummary");
  const rows = customerFilteredRows();
  if (summary) summary.textContent = `${rows.length.toLocaleString("en-IN")} customers shown.`;
  if (!body) return;

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty-state">No customers found.</td></tr>';
    return;
  }

  body.innerHTML = rows.map(row => {
    const status = customerStatus(row);
    return `
      <tr>
        <td>${customerEscape(row.id)}</td>
        <td>${customerEscape(row.name)}</td>
        <td>${customerEscape(row.area)}</td>
        <td>${row.orders.toLocaleString("en-IN")}</td>
        <td><strong>${customerCurrency(row.ltv)}</strong></td>
        <td>${customerEscape(customerSince(row.customerSince))}</td>
        <td><span class="badge ${customerStatusBadge(status)}">${customerEscape(status)}</span></td>
      </tr>
    `;
  }).join("");
}

function customerRender() {
  customerRenderCards();
  customerRenderTable();
}

function customerBuildRows(orders, profilesById) {
  const map = new Map();

  orders.forEach(order => {
    const profile = profilesById.get(order.user_id) || {};
    const key = customerKey({ ...order, profile });
    const existing = map.get(key) || {
      id: `C-${String(key).replace(/[^a-zA-Z0-9]/g, "").slice(-6) || String(map.size + 1).padStart(4, "0")}`,
      key,
      name: profile.name || "Customer",
      mobile: profile.mobile || "",
      email: profile.email || "",
      area: customerArea(profile, order),
      orders: 0,
      ltv: 0,
      customerSince: order.ordered_at,
      hasActiveSubscription: false,
      hasCancelledSubscription: false,
      cancelledOrders: 0
    };

    existing.name = profile.name || existing.name;
    existing.mobile = profile.mobile || existing.mobile;
    existing.email = profile.email || existing.email;
    existing.area = existing.area === "Area not stored" ? customerArea(profile, order) : existing.area;
    existing.orders += 1;
    if (customerIsDelivered(order)) existing.ltv += Number(order.total_amount) || 0;
    if (customerIsCancelled(order)) existing.cancelledOrders += 1;

    const orderDate = customerDate(order.ordered_at);
    const currentSince = customerDate(existing.customerSince);
    if (orderDate && (!currentSince || orderDate < currentSince)) {
      existing.customerSince = order.ordered_at;
    }

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    if (items.some(item => customerIsSubscriptionItem({
      plan: item.plan,
      startDate: item.start_date,
      endDate: item.end_date
    }) && !item.cancelled && !customerIsCancelled(order))) {
      existing.hasActiveSubscription = true;
    }
    if (items.some(item => item.cancelled && customerIsSubscriptionItem({
      plan: item.plan,
      startDate: item.start_date,
      endDate: item.end_date
    }))) {
      existing.hasCancelledSubscription = true;
    }

    map.set(key, existing);
  });

  profilesById.forEach((profile, id) => {
    if (map.has(id)) return;
    map.set(id, {
      id: `C-${String(id).replace(/[^a-zA-Z0-9]/g, "").slice(-6)}`,
      key: id,
      name: profile.name || "Customer",
      mobile: profile.mobile || "",
      email: profile.email || "",
      area: customerArea(profile, {}),
      orders: 0,
      ltv: 0,
      customerSince: profile.created_at || "",
      hasActiveSubscription: false,
      hasCancelledSubscription: false,
      cancelledOrders: 0
    });
  });

  return [...map.values()].sort((a, b) => b.ltv - a.ltv || b.orders - a.orders);
}

async function customerLoadData() {
  const sb = window.supabaseClient;
  if (!sb) throw new Error("Supabase connection missing.");

  const { data: orders, error } = await sb
    .from("orders")
    .select("*, order_items (*)")
    .order("ordered_at", { ascending: false });

  if (error) throw error;

  const userIds = [...new Set((orders || []).map(order => order.user_id).filter(Boolean))];
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

  customerRows = customerBuildRows(orders || [], profilesById);
  customerRender();
}

function customerBuildPage(app) {
  app.innerHTML = `
    <section class="customers-dashboard">
      <section class="stats-grid" aria-label="Customer metrics">
        <article class="stat-card">
          <div class="stat-heading">
            <span>TOTAL CUSTOMERS</span>
            <span class="stat-icon" data-customer-icon="customers" aria-hidden="true"></span>
          </div>
          <strong id="totalCustomersValue">0</strong>
          <span class="stat-detail" id="totalCustomersDetail">Lifetime</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>SUBSCRIBED</span>
            <span class="stat-icon" data-customer-icon="heart" aria-hidden="true"></span>
          </div>
          <strong id="subscribedCustomersValue">0</strong>
          <span class="stat-detail" id="subscribedCustomersDetail">0% of base</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>CHURNED</span>
            <span class="stat-icon" data-customer-icon="churn" aria-hidden="true"></span>
          </div>
          <strong id="churnedCustomersValue">0</strong>
          <span class="stat-detail" id="churnedCustomersDetail">Win back campaigns</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>TOTAL LTV (SHOWN)</span>
            <span class="stat-icon" data-customer-icon="revenue" aria-hidden="true"></span>
          </div>
          <strong id="totalLtvValue">Rs. 0</strong>
          <span class="stat-detail" id="totalLtvDetail">Sum of lifetime value</span>
        </article>
      </section>

      <section class="customers-panel">
        <div class="customers-directory-head">
          <h2>Customer directory</h2>
          <div class="customer-search-wrap">
            <span data-customer-search-icon aria-hidden="true"></span>
            <input type="search" id="customerSearch" placeholder="Search name or area">
          </div>
        </div>
        <p class="page-note" id="customerSummary">Loading customers.</p>
        <div class="customers-table-wrap">
          <table class="customers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Area</th>
                <th>Orders</th>
                <th>Lifetime value</th>
                <th>Customer since</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="customerRows"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

  customerRenderIcons();
  document.getElementById("customerSearch")?.addEventListener("input", customerRenderTable);
}

AdminPages.mount({
  key: "customers",
  title: "Customers",
  copy: "Everyone who has ever ordered from the customer app.",
  status: "Customer live"
}, app => {
  customerBuildPage(app);
  customerLoadData().catch(error => {
    console.log(error);
    customerRender();
  });

  window.supabaseClient
    ?.channel("jfam-customers")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => customerLoadData())
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => customerLoadData())
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => customerLoadData())
    .subscribe();
});
