const productIcons = {
  products: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
  stock: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/></svg>',
  revenue: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10M7 9h10M9 5c4 0 6 2 6 5s-2 5-6 5l6 4"/></svg>',
  alert: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 9v4M12 17h.01"/></svg>',
  trendUp: '<svg class="lumi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l5-5 4 4 7-7"/><path d="M15 8h5v5"/></svg>'
};

let productRows = [];

const PRODUCT_CATALOGUE = [
  { name: "Raw Buffalo Milk", sku: "P-01", price: 75, unit: "L" },
  { name: "Raw Cow Milk", sku: "P-02", price: 51, unit: "L" },
  { name: "Raw A2 Cow Milk", sku: "P-03", price: 85, unit: "L" },
  { name: "Buffalo Bilona Chaach", sku: "P-04", price: 40, unit: "L" },
  { name: "Cow Bilona Chaach", sku: "P-05", price: 35, unit: "L" },
  { name: "Buffalo Ghee", sku: "P-06", price: 1300, unit: "kg" },
  { name: "Cow Ghee", sku: "P-07", price: 1100, unit: "kg" },
  { name: "Raw A2 Cow Ghee", sku: "P-08", price: 2800, unit: "kg" },
  { name: "Dahi", sku: "P-09", price: 72, unit: "500gm" },
  { name: "Paneer", sku: "P-10", price: 450, unit: "kg" }
];


function productEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function productCurrency(value) {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function productDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function productStartOfDay(offset = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function productIsToday(value) {
  const date = productDate(value);
  const start = productStartOfDay();
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return Boolean(date && date >= start && date <= end);
}

function productIsYesterday(value) {
  const date = productDate(value);
  const start = productStartOfDay(-1);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return Boolean(date && date >= start && date <= end);
}

function productTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function productKey(name) {
  return String(name || "Unknown product").trim().toLowerCase();
}

function productCatalogueIndex(name) {
  const key = productKey(name);
  return PRODUCT_CATALOGUE.findIndex(product => productKey(product.name) === key);
}

function productSku(index, product) {
  return product.sku || product.SKU || product.code || product.product_code || `P-${String(index + 1).padStart(2, "0")}`;
}

function productStock(product) {
  const value = product.stock ?? product.stock_units ?? product.units_in_stock ?? product.inventory ?? product.quantity_available ?? product.available_units;
  return Math.max(0, Number(value) || 0);
}

function productPrice(product) {
  return Number(product.price ?? product.unit_price ?? product.selling_price ?? product.amount) || 0;
}
function productUnit(product) {
  return product.unit || product.measurement_unit || product.unit_label || product.price_unit || "";
}

function productPriceLabel(row) {
  const price = productCurrency(row.price);
  return row.unit ? `${price}/${row.unit}` : price;
}

function productStatus(stock) {
  if (stock <= 0) return "Out";
  if (stock < 100) return "Low";
  return "In stock";
}

function productStatusBadge(status) {
  if (status === "Out") return "cancelled";
  if (status === "Low") return "preparing";
  return "delivered";
}

function productRenderIcons() {
  document.querySelectorAll("[data-product-icon]").forEach(icon => {
    icon.innerHTML = productIcons[icon.dataset.productIcon] || productIcons.products;
  });
  document.querySelectorAll(".trend-icon").forEach(icon => {
    icon.innerHTML = productIcons.trendUp;
  });
}

function productSetText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function productRenderCards() {
  const activeSkus = productRows.length;
  const stock = productRows.reduce((sum, row) => sum + row.stock, 0);
  const soldToday = productRows.reduce((sum, row) => sum + row.soldToday, 0);
  const soldYesterday = productRows.reduce((sum, row) => sum + row.soldYesterday, 0);
  const revenueToday = productRows.reduce((sum, row) => sum + row.revenueToday, 0);
  const restockAlerts = productRows.filter(row => row.status !== "In stock").length;
  const trend = productTrend(soldToday, soldYesterday);

  productSetText("activeSkusValue", activeSkus.toLocaleString("en-IN"));
  productSetText("stockUnitsValue", stock.toLocaleString("en-IN"));
  productSetText("unitsSoldValue", soldToday.toLocaleString("en-IN"));
  productSetText("restockAlertsValue", restockAlerts.toLocaleString("en-IN"));
  productSetText("unitsSoldDetail", `${productCurrency(revenueToday)} in product revenue`);
  const trendLabel = document.querySelector("#unitsSoldTrend span:last-child");
  if (trendLabel) trendLabel.textContent = `${trend >= 0 ? "+" : "-"}${Math.abs(Math.round(trend))}% vs yesterday`;
}

function productRenderProductCards() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  if (!productRows.length) {
    grid.innerHTML = '<div class="empty-state">No product records found in Supabase yet.</div>';
    return;
  }

  const maxStock = Math.max(...productRows.map(row => row.stock), 1);
  grid.innerHTML = productRows.slice(0, 6).map(row => {
    const width = Math.min(Math.round((row.stock / maxStock) * 100), 100);
    return `
      <article class="product-card">
        <div class="product-card-head">
          <div>
            <h2>${productEscape(row.name)}</h2>
            <div class="product-card-meta">${productEscape(productPriceLabel(row))} · SKU ${productEscape(row.sku)}</div>
          </div>
          <span class="badge ${productStatusBadge(row.status)}">${productEscape(row.status)}</span>
        </div>
        <div class="product-stock-row">
          <span>Stock level</span>
          <strong>${row.stock.toLocaleString("en-IN")} units</strong>
        </div>
        <div class="product-stock-track" aria-hidden="true">
          <span class="product-stock-fill" style="--stock-width:${width}%"></span>
        </div>
        <div class="product-mini-grid">
          <div class="product-mini">
            <span>Sold today</span>
            <strong>${row.soldToday.toLocaleString("en-IN")}</strong>
          </div>
          <div class="product-mini">
            <span>Revenue</span>
            <strong>${productCurrency(row.revenueToday)}</strong>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function productRenderCatalogue() {
  const body = document.getElementById("productRows");
  if (!body) return;

  if (!productRows.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty-state">No products found.</td></tr>';
    return;
  }

  body.innerHTML = productRows.map(row => `
    <tr>
      <td>${productEscape(row.sku)}</td>
      <td>${productEscape(row.name)}</td>
      <td>${productEscape(productPriceLabel(row))}</td>
      <td>${row.stock.toLocaleString("en-IN")}</td>
      <td>${row.soldToday.toLocaleString("en-IN")}</td>
      <td><strong>${productCurrency(row.revenueToday)}</strong></td>
      <td><span class="badge ${productStatusBadge(row.status)}">${productEscape(row.status)}</span></td>
    </tr>
  `).join("");
}

function productRender() {
  productRenderCards();
  productRenderProductCards();
  productRenderCatalogue();
}

function productBuildRows(products, orders) {
  const map = new Map();

  PRODUCT_CATALOGUE.forEach(product => {
    map.set(productKey(product.name), {
      name: product.name,
      sku: product.sku,
      price: product.price,
      unit: product.unit,
      stock: 0,
      soldToday: 0,
      soldYesterday: 0,
      revenueToday: 0,
      status: productStatus(0)
    });
  });

  (products || []).forEach((product, index) => {
    const name = product.name || product.product_name || product.title || `Product ${index + 1}`;
    const stock = productStock(product);
    const key = productKey(name);
    const existing = map.get(key);
    const catalogue = productCatalogueItem(name);
    map.set(key, {
      name: catalogue?.name || existing?.name || name,
      sku: catalogue?.sku || existing?.sku || productSku(index, product),
      price: catalogue?.price ?? existing?.price ?? productPrice(product),
      unit: catalogue?.unit || existing?.unit || productUnit(product),
      stock,
      soldToday: existing?.soldToday || 0,
      soldYesterday: existing?.soldYesterday || 0,
      revenueToday: existing?.revenueToday || 0,
      status: productStatus(stock)
    });
  });

  (orders || []).forEach(order => {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    items.forEach(item => {
      const name = item.product_name || "Unknown product";
      const key = productKey(name);
      const row = map.get(key) || {
        name,
        sku: `P-${String(map.size + 1).padStart(2, "0")}`,
        price: Number(item.price) || 0,
        unit: "",
        stock: Number(item.stock ?? item.stock_units ?? item.available_units) || 0,
        soldToday: 0,
        soldYesterday: 0,
        revenueToday: 0,
        status: "Out"
      };
      const units = Number(item.packets) || Number(item.quantity) || 1;
      const value = (row.price || Number(item.price) || 0) * units;
      if (productIsToday(order.ordered_at || order.updated_at)) {
        row.soldToday += units;
        row.revenueToday += value;
      }
      if (productIsYesterday(order.ordered_at || order.updated_at)) {
        row.soldYesterday += units;
      }
      if (!row.price) row.price = Number(item.price) || 0;
      if (!map.has(key)) row.status = productStatus(row.stock);
      map.set(key, row);
    });
  });

  return [...map.values()].map(row => ({
    ...row,
    status: productStatus(row.stock)
    })).sort((a, b) => {
    const aIndex = productCatalogueIndex(a.name);
    const bIndex = productCatalogueIndex(b.name);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
    }
    return b.revenueToday - a.revenueToday || a.name.localeCompare(b.name);
  });
 
}

async function productLoadData() {
  const sb = window.supabaseClient;
  if (!sb) throw new Error("Supabase connection missing.");

  const { data: orders, error } = await sb
    .from("orders")
    .select("*, order_items (*)")
    .order("ordered_at", { ascending: false });

  if (error) throw error;

  let products = [];
  try {
    const { data: productData, error: productError } = await sb
      .from("products")
      .select("*");
    if (!productError) products = productData || [];
  } catch (error) {
    console.log(error);
  }

  productRows = productBuildRows(products, orders || []);
  productRender();
}

function productBuildPage(app) {
  app.innerHTML = `
    <section class="products-dashboard">
      <section class="stats-grid" aria-label="Product metrics">
        <article class="stat-card">
          <div class="stat-heading">
            <span>ACTIVE SKUS</span>
            <span class="stat-icon" data-product-icon="products" aria-hidden="true"></span>
          </div>
          <strong id="activeSkusValue">0</strong>
          <span class="stat-detail">Across catalogue</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>UNITS IN STOCK</span>
            <span class="stat-icon" data-product-icon="stock" aria-hidden="true"></span>
          </div>
          <strong id="stockUnitsValue">0</strong>
          <span class="stat-detail">Ready to dispatch</span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>UNITS SOLD TODAY</span>
            <span class="stat-icon" data-product-icon="revenue" aria-hidden="true"></span>
          </div>
          <strong id="unitsSoldValue">0</strong>
          <span class="stat-detail" id="unitsSoldDetail">Rs. 0 in product revenue</span>
          <span class="stat-trend" id="unitsSoldTrend"><span class="trend-icon" aria-hidden="true"></span><span>+0% vs yesterday</span></span>
        </article>
        <article class="stat-card">
          <div class="stat-heading">
            <span>RESTOCK ALERTS</span>
            <span class="stat-icon" data-product-icon="alert" aria-hidden="true"></span>
          </div>
          <strong id="restockAlertsValue">0</strong>
          <span class="stat-detail">Low or out of stock</span>
        </article>
      </section>

      <section class="products-grid" id="productsGrid" aria-label="Product stock cards"></section>

      <section class="products-panel">
        <h2>Catalogue</h2>
        <div class="products-table-wrap">
          <table class="products-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Sold today</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="productRows"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

  productRenderIcons();
}

AdminPages.mount({
  key: "products",
  title: "Products",
  copy: "Your dairy catalogue and today's stock movement.",
  status: "Catalogue live"
}, app => {
  productBuildPage(app);
  productLoadData().catch(error => {
    console.log(error);
    productRender();
  });

  window.supabaseClient
    ?.channel("jfam-products")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => productLoadData())
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => productLoadData())
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => productLoadData())
    .subscribe();
});
