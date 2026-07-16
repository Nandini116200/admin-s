const PAGE_ICONS = {
  menu: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  dashboard: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z"/></svg>',
  kpis: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7M4 19h16"/></svg>',
  confirmed: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 6"/><path d="M4 20h16"/></svg>',
  delivered: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v10H3zM14 11h4l3 3v3h-7z"/><path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
  revenue: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10M7 9h10M9 5c4 0 6 2 6 5s-2 5-6 5l6 4"/></svg>',
  subscriptions: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3"/><path d="M4 11V8a2 2 0 0 1 2-2h14"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v3a2 2 0 0 1-2 2H4"/></svg>',
  delivery: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10v9H4zM14 10h4l3 3v3h-7z"/><path d="M8 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
  customers: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0"/><path d="M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-5-6"/></svg>',
  products: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>'
};

function pageSetSidebarCollapsed(isCollapsed) {
  const dashboard = document.getElementById("adminDashboard");
  const toggle = document.getElementById("sidebarToggleBtn");
  dashboard?.classList.toggle("sidebar-collapsed", isCollapsed);
  toggle?.setAttribute("aria-expanded", String(!isCollapsed));
  toggle?.setAttribute("aria-label", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
  localStorage.setItem("jfamSidebarCollapsed", String(isCollapsed));
}

function pageApplyIcons(activeKey) {
  document.querySelectorAll("[data-nav-key]").forEach(link => {
    link.classList.toggle("active", link.dataset.navKey === activeKey);
    const icon = link.querySelector("span:first-child");
    if (icon) icon.innerHTML = PAGE_ICONS[link.dataset.navKey] || PAGE_ICONS.dashboard;
  });

  const toggleIcon = document.querySelector("#sidebarToggleBtn span");
  if (toggleIcon) toggleIcon.innerHTML = PAGE_ICONS.menu;
}

function pageBuildShell(config) {
  const shell = document.getElementById("adminPageShell");
  if (!shell) return;

  shell.innerHTML = `
    <main class="admin-shell">
      <section class="admin-dashboard" id="adminDashboard">
        <aside class="admin-sidebar" aria-label="Admin navigation">
          <a class="brand-lockup" href="index.html" aria-label="JFAM founder console">
            <span class="brand-mark">J</span>
            <span>
              <strong>JFAM</strong>
              <small>Founder console</small>
            </span>
          </a>
          <nav class="side-nav">
            <p>Overview</p>
            <a href="index.html" data-nav-key="dashboard"><span></span> Dashboard</a>
            <a href="Kpis.html" data-nav-key="kpis"><span></span> KPIs</a>
            <p>Today</p>
            <a href="Confirmed.html" data-nav-key="confirmed"><span></span> Orders Confirmed</a>
            <a href="Orders.html" data-nav-key="delivered"><span></span> Orders Delivered</a>
            <a href="Revenue.html" data-nav-key="revenue"><span></span> Revenue</a>
            <p>Manage</p>
            <a href="Subscriptions.html" data-nav-key="subscriptions"><span></span> Subscriptions</a>
            <a href="Delivery.html" data-nav-key="delivery"><span></span> Delivery Partners</a>
            <a href="Customers.html" data-nav-key="customers"><span></span> Customers</a>
            <a href="Products.html" data-nav-key="products"><span></span> Products</a>
          </nav>
        </aside>
        <div class="admin-content">
          <header class="admin-header">
            <div class="admin-title-row">
              <button type="button" class="sidebar-toggle" id="sidebarToggleBtn" aria-label="Collapse sidebar" aria-expanded="true">
                <span aria-hidden="true"></span>
              </button>
              <div>
                <h1 id="pageTitle"></h1>
                <div class="header-copy-row">
                  <p class="header-copy" id="pageCopy"></p>
                  <span class="delivery-status"><span class="status-dot" aria-hidden="true"></span>${config.status || "Connected page"}</span>
                </div>
              </div>
            </div>
          </header>
          <hr/>
          <div id="pageApp"></div>
        </div>
        <nav class="bottom-nav" aria-label="Primary admin navigation">
          <a href="index.html" data-nav-key="dashboard"><span></span> Dashboard</a>
          <a href="Orders.html" data-nav-key="delivered"><span></span> Orders</a>
          <a href="Revenue.html" data-nav-key="revenue"><span></span> Revenue</a>
          <a href="Products.html" data-nav-key="products"><span></span> Products</a>
        </nav>
      </section>
    </main>
  `;

  document.title = `${config.title} | JFAM Admin`;
  document.getElementById("pageTitle").textContent = config.title;
  document.getElementById("pageCopy").textContent = config.copy;
  pageApplyIcons(config.key);

  document.getElementById("sidebarToggleBtn")?.addEventListener("click", () => {
    const dashboard = document.getElementById("adminDashboard");
    pageSetSidebarCollapsed(!dashboard?.classList.contains("sidebar-collapsed"));
  });
  pageSetSidebarCollapsed(localStorage.getItem("jfamSidebarCollapsed") === "true");
}

function pageCards(cards) {
  return `
    <section class="page-grid" aria-label="Metrics">
      ${cards.map(card => `
        <article class="page-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
          <span>${card.detail}</span>
        </article>
      `).join("")}
    </section>
  `;
}

function pageList(title, items) {
  return `
    <section class="page-panel">
      <h2>${title}</h2>
      <ul class="page-list">
        ${items.map(item => `
          <li>
            <b>${item.title}</b>
            <span>${item.detail}</span>
          </li>
        `).join("")}
      </ul>
    </section>
  `;
}

function pageTable(headers, rows) {
  return `
    <section class="page-panel">
      <div class="page-table-wrap">
        <table class="page-table">
          <thead>
            <tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

window.AdminPages = {
  mount(config, render) {
    pageBuildShell(config);
    const app = document.getElementById("pageApp");
    if (!app) return;
    render(app, { pageCards, pageList, pageTable });
  }
};
