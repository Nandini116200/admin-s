const ADMIN_STATUS_OPTIONS = [
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

const adminState = {
  orders: [],
  highlightedOrderId: "",
  soundEnabled: false,
  channel: null
};

const adminEls = {
  loginPanel: document.getElementById("adminLoginPanel"),
  dashboard: document.getElementById("adminDashboard"),
  loginForm: document.getElementById("adminLoginForm"),
  otpForm: document.getElementById("adminOtpForm"),
  email: document.getElementById("adminEmailInput"),
  otp: document.getElementById("adminOtpInput"),
  loginStatus: document.getElementById("adminLoginStatus"),
  logout: document.getElementById("adminLogoutBtn"),
  refresh: document.getElementById("refreshOrdersBtn"),
  sound: document.getElementById("enableSoundBtn"),
  search: document.getElementById("orderSearchInput"),
  statusFilter: document.getElementById("orderStatusFilter"),
  list: document.getElementById("ordersList"),
  total: document.getElementById("totalOrdersStat"),
  confirmed: document.getElementById("confirmedOrdersStat"),
  today: document.getElementById("todayOrdersStat"),
  revenue: document.getElementById("revenueStat"),
  toast: document.getElementById("adminToast")
};

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

  return {
    id: row.id,
    userId: row.user_id,
    orderedAt: row.ordered_at,
    paymentMode: row.payment_mode || "",
    status: row.status || "Confirmed",
    codFee: Number(row.cod_fee) || 0,
    totalAmount: Number(row.total_amount) || 0,
    customerName: profile.name || "",
    customerMobile: profile.mobile || "",
    customerEmail: profile.email || "",
    items: items
      .slice()
      .sort((a, b) => Number(a.item_index) - Number(b.item_index))
      .map(item => ({
        index: Number(item.item_index) || 0,
        name: item.product_name || "",
        price: Number(item.price) || 0,
        quantity: item.quantity || "",
        packets: Number(item.packets) || 1,
        startDate: item.start_date || "",
        endDate: item.end_date || "",
        slot: item.slot || "",
        plan: item.plan || "",
        cancelled: Boolean(item.cancelled)
      }))
  };
}

function adminFilteredOrders() {
  const query = adminEls.search.value.trim().toLowerCase();
  const status = adminEls.statusFilter.value;

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

function adminRenderStats() {
  const todayKey = new Date().toDateString();
  const todayOrders = adminState.orders.filter(order =>
    new Date(order.orderedAt).toDateString() === todayKey
  );
  const revenue = adminState.orders.reduce((sum, order) => {
    if (String(order.status).toLowerCase().includes("cancel")) return sum;
    return sum + Number(order.totalAmount || 0);
  }, 0);

  adminEls.total.textContent = adminState.orders.length;
  adminEls.confirmed.textContent = adminState.orders.filter(order => order.status === "Confirmed").length;
  adminEls.today.textContent = todayOrders.length;
  adminEls.revenue.textContent = adminCurrency(revenue);
}

function adminRenderOrders() {
  adminRenderStats();
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
            <select data-order-status="${adminEscape(order.id)}">${statusOptions}</select>
            <button type="button" data-save-status="${adminEscape(order.id)}">Update Status</button>
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
        cancelled
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
    .subscribe();
}

async function adminShowDashboard() {
  adminEls.loginPanel.classList.add("hidden");
  adminEls.dashboard.classList.remove("hidden");
  await adminLoadOrders();
  adminStartRealtime();
}

adminEls.loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = adminEls.email.value.trim().toLowerCase();
  if (!email) return;

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
    return;
  }

  localStorage.setItem("jfamAdminEmail", email);
  adminEls.otpForm.classList.remove("hidden");
  adminSetLoginStatus("OTP sent. Check admin email.");
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

adminEls.logout.addEventListener("click", async () => {
  await adminGetSupabase().auth.signOut();
  window.location.reload();
});

adminEls.refresh.addEventListener("click", () => adminLoadOrders());
adminEls.search.addEventListener("input", adminRenderOrders);
adminEls.statusFilter.addEventListener("change", adminRenderOrders);

adminEls.sound.addEventListener("click", async () => {
  adminState.soundEnabled = true;
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
  adminToast("Alerts enabled.");
});

adminEls.list.addEventListener("click", event => {
  const button = event.target.closest("[data-save-status]");
  if (!button) return;
  adminUpdateOrderStatus(button.dataset.saveStatus);
});

adminGetSupabase().auth.getSession().then(({ data }) => {
  if (data?.session) {
    adminShowDashboard();
  }
});
