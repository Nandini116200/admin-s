const DB_TABLES = {
  product_catalog: {
    label: "Product catalog",
    key: ["product_name"],
    order: "display_order",
    editable: [
      "category",
      "description",
      "image_url",
      "display_price_text",
      "unit_label",
      "default_price",
      "monthly_price",
      "fifteen_day_price",
      "weekly_price",
      "one_time_price",
      "custom_price",
      "stock_quantity",
      "low_stock_limit",
      "is_available",
      "availability_message",
      "admin_note"
    ],
    columns: [
      "product_name",
      "category",
      "display_price_text",
      "default_price",
      "stock_quantity",
      "low_stock_limit",
      "is_available",
      "availability_message",
      "updated_at"
    ]
  },
  orders: {
    label: "Orders",
    key: ["id"],
    order: "ordered_at",
    descending: true,
    editable: ["status", "payment_mode", "total_amount", "cod_fee"],
    columns: ["id", "ordered_at", "payment_mode", "status", "total_amount", "cod_fee", "user_id", "updated_at"]
  },
  order_items: {
    label: "Order items",
    key: ["order_id", "item_index"],
    order: "updated_at",
    descending: true,
    editable: [
      "product_name",
      "price",
      "quantity",
      "packets",
      "slot",
      "plan",
      "cancelled",
      "delivery_controls_summary"
    ],
    columns: [
      "order_id",
      "item_index",
      "product_name",
      "price",
      "quantity",
      "packets",
      "slot",
      "plan",
      "cancelled",
      "delivery_controls_summary",
      "updated_at"
    ]
  },
  profiles: {
    label: "Profiles (read only)",
    key: ["id"],
    searchColumn: "email",
    order: "created_at",
    descending: true,
    editable: [],
    columns: ["id", "name", "mobile", "email", "dob", "created_at"]
  }
};

const DB_SUPABASE_PROJECT_REF = "eohyhutadbpghjvbwecv";
const DB_SUPABASE_PROJECT_URL = `https://supabase.com/dashboard/project/${DB_SUPABASE_PROJECT_REF}`;
const DB_SUPABASE_TABLE_EDITOR_URL = `${DB_SUPABASE_PROJECT_URL}/editor`;
const DB_ALL_TABLE_NAMES = [
  "admin_users",
  "product_catalog",
  "orders",
  "order_items",
  "profiles",
  "inventory_movements",
  "cart_items",
  "wishlist_items",
  "saved_addresses",
  "saved_upis"
];

const DB_PAGE_SIZE = 40;
let dbRows = [];
let dbSelectedTable = "product_catalog";
let dbChannel = null;

function dbEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function dbConfig() {
  return DB_TABLES[dbSelectedTable] || DB_TABLES.product_catalog;
}

function dbCellId(rowIndex, column) {
  return `db-${rowIndex}-${column}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function dbColumnLabel(column) {
  return String(column || "").replace(/_/g, " ");
}

function dbSetStatus(message, tone = "") {
  const status = document.getElementById("dbStatus");
  if (!status) return;
  status.textContent = message || "";
  status.className = `db-status ${tone}`.trim();
}

function dbValueForInput(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function dbParseValue(rawValue, previousValue) {
  if (typeof previousValue === "boolean") return rawValue === "true";
  if (typeof previousValue === "number") return rawValue === "" ? null : Number(rawValue);
  if (previousValue && typeof previousValue === "object") {
    if (!rawValue.trim()) return null;
    return JSON.parse(rawValue);
  }
  return rawValue === "" ? null : rawValue;
}

function dbColumnInput(row, rowIndex, column, editable) {
  const id = dbCellId(rowIndex, column);
  const value = row[column];
  const escaped = dbEscape(dbValueForInput(value));

  if (!editable) {
    return `<div class="db-key">${escaped || "-"}</div>`;
  }

  if (typeof value === "boolean") {
    return `
      <select id="${id}" data-db-column="${dbEscape(column)}">
        <option value="true" ${value ? "selected" : ""}>true</option>
        <option value="false" ${!value ? "selected" : ""}>false</option>
      </select>
    `;
  }

  if (value && typeof value === "object") {
    return `<textarea id="${id}" data-db-column="${dbEscape(column)}">${escaped}</textarea>`;
  }

  if (typeof value === "number") {
    return `<input id="${id}" type="number" step="any" value="${escaped}" data-db-column="${dbEscape(column)}">`;
  }

  return `<input id="${id}" type="text" value="${escaped}" data-db-column="${dbEscape(column)}">`;
}

function dbRenderRows() {
  const body = document.getElementById("dbRows");
  const head = document.getElementById("dbHead");
  if (!body || !head) return;

  const config = dbConfig();
  const columns = config.columns;
  document.getElementById("dbTableWrap")?.setAttribute("data-db-table", dbSelectedTable);

  head.innerHTML = `
    <tr>
      ${columns.map(column => `<th>${dbEscape(dbColumnLabel(column))}</th>`).join("")}
      <th>Action</th>
    </tr>
  `;

  if (!dbRows.length) {
    body.innerHTML = `<tr><td class="db-empty" colspan="${columns.length + 1}">No rows found.</td></tr>`;
    return;
  }

  body.innerHTML = dbRows.map((row, rowIndex) => `
    <tr data-db-row="${rowIndex}">
      ${columns.map(column => `
        <td>${dbColumnInput(row, rowIndex, column, config.editable.includes(column))}</td>
      `).join("")}
      <td class="db-actions">
        ${config.editable.length
          ? `<button type="button" data-db-save="${rowIndex}">Save</button>`
          : `<span class="db-readonly">Read only</span>`}
      </td>
    </tr>
  `).join("");
}

function dbBuildQuery(table, config, search) {
  let query = window.supabaseClient
    .from(table)
    .select(config.columns.join(","))
    .limit(DB_PAGE_SIZE);

  if (config.order) {
    query = query.order(config.order, { ascending: !config.descending });
  }

  if (search) {
    const firstKey = config.searchColumn || config.key[0];
    query = query.ilike(firstKey, `%${search}%`);
  }

  return query;
}

async function dbLoadRows() {
  const config = dbConfig();
  const search = document.getElementById("dbSearch")?.value.trim() || "";
  dbSetStatus(`Loading ${config.label}...`);

  const { data, error } = await dbBuildQuery(dbSelectedTable, config, search);
  if (error) {
    console.log(error);
    dbRows = [];
    dbRenderRows();
    dbSetStatus(error.message || "Could not load table.", "error");
    return;
  }

  dbRows = data || [];
  dbRenderRows();
  dbSetStatus(`${dbRows.length} rows loaded from ${config.label}.`, "success");
}

function dbUpdateQueryForKeys(query, config, row) {
  config.key.forEach(column => {
    query = query.eq(column, row[column]);
  });
  return query;
}

async function dbSaveRow(rowIndex) {
  const config = dbConfig();
  const row = dbRows[rowIndex];
  if (!row || !config.editable.length) return;

  const updates = {};

  try {
    config.editable.forEach(column => {
      if (!config.columns.includes(column)) return;
      const input = document.getElementById(dbCellId(rowIndex, column));
      if (!input) return;
      updates[column] = dbParseValue(input.value, row[column]);
    });
  } catch (error) {
    dbSetStatus(`Invalid value: ${error.message}`, "error");
    return;
  }

  if ("updated_at" in row) updates.updated_at = new Date().toISOString();

  dbSetStatus("Saving row...");
  let query = window.supabaseClient
    .from(dbSelectedTable)
    .update(updates);
  query = dbUpdateQueryForKeys(query, config, row);

  const { error } = await query;
  if (error) {
    console.log(error);
    dbSetStatus(error.message || "Save failed. Check RLS policy.", "error");
    return;
  }

  dbSetStatus("Row saved.", "success");
  await dbLoadRows();
}

function dbStartRealtime() {
  const sb = window.supabaseClient;
  if (dbChannel) sb.removeChannel(dbChannel);

  dbChannel = sb
    .channel(`jfam-db-editor-${dbSelectedTable}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: dbSelectedTable },
      () => dbLoadRows()
    )
    .subscribe();
}

function dbRenderToolbar(app) {
  app.innerHTML = `
    <section class="db-dashboard">
      <section class="db-link-panel">
        <div>
          <h2>Supabase Dashboard</h2>
          <p>Use these links for full table access. Quick Editor below is for common safe admin edits.</p>
        </div>
        <div class="db-link-actions">
          <a class="db-link-btn" href="${DB_SUPABASE_PROJECT_URL}" target="_blank" rel="noopener">Open project</a>
          <a class="db-link-btn primary" href="${DB_SUPABASE_TABLE_EDITOR_URL}" target="_blank" rel="noopener">Open all tables</a>
        </div>
      </section>

      <section class="db-table-links" aria-label="Supabase table shortcuts">
        ${DB_ALL_TABLE_NAMES.map(table => `
          <a href="${DB_SUPABASE_TABLE_EDITOR_URL}" target="_blank" rel="noopener" title="Open Supabase table editor, then choose ${dbEscape(table)}">
            ${dbEscape(table)}
          </a>
        `).join("")}
      </section>

      <section class="db-toolbar">
        <label>
          <span>Quick editor table</span>
          <select id="dbTableSelect">
            ${Object.entries(DB_TABLES).map(([key, config]) => `
              <option value="${dbEscape(key)}">${dbEscape(config.label)}</option>
            `).join("")}
          </select>
        </label>
        <label>
          <span>Search by primary key</span>
          <input type="search" id="dbSearch" placeholder="Type id/product name/order id">
        </label>
        <div class="db-toolbar-actions">
          <button type="button" class="db-refresh-btn" id="dbRefreshBtn">Refresh</button>
          <a class="db-open-selected" id="dbOpenSelectedTable" href="${DB_SUPABASE_TABLE_EDITOR_URL}" target="_blank" rel="noopener">
            Open selected
          </a>
        </div>
      </section>

      <section class="db-panel">
        <div class="db-panel-head">
          <p class="db-status" id="dbStatus">Choose a table to begin.</p>
          <p class="db-scroll-hint">Scroll sideways to see all columns.</p>
        </div>
        <div class="db-table-wrap" id="dbTableWrap" data-db-table="${dbEscape(dbSelectedTable)}">
          <table class="db-table">
            <thead id="dbHead"></thead>
            <tbody id="dbRows"></tbody>
          </table>
        </div>
      </section>
    </section>
  `;

  document.getElementById("dbTableSelect").value = dbSelectedTable;
}

function dbSyncSelectedTableLink() {
  const link = document.getElementById("dbOpenSelectedTable");
  if (!link) return;
  link.href = DB_SUPABASE_TABLE_EDITOR_URL;
  link.title = `Open Supabase table editor, then choose ${dbSelectedTable}`;
}

AdminPages.mount({
  key: "database",
  title: "Supabase access",
  copy: "Quick edit common rows here, or open the full Supabase table editor for every backend table.",
  status: "Quick editor + links"
}, app => {
  dbRenderToolbar(app);
  dbLoadRows();
  dbStartRealtime();

  document.getElementById("dbTableSelect")?.addEventListener("change", event => {
    dbSelectedTable = event.target.value;
    dbRows = [];
    dbSyncSelectedTableLink();
    dbLoadRows();
    dbStartRealtime();
  });

  dbSyncSelectedTableLink();
  document.getElementById("dbRefreshBtn")?.addEventListener("click", dbLoadRows);
  document.getElementById("dbSearch")?.addEventListener("keydown", event => {
    if (event.key === "Enter") dbLoadRows();
  });
  document.getElementById("dbRows")?.addEventListener("click", event => {
    const button = event.target.closest("[data-db-save]");
    if (!button) return;
    dbSaveRow(Number(button.dataset.dbSave));
  });
});
