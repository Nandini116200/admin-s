const JFAM_PRODUCT_CATALOGUE = [
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

function jfamProductKey(name) {
  return String(name || "").trim().toLowerCase();
}

function jfamCatalogueItem(name) {
  const key = jfamProductKey(name);
  return JFAM_PRODUCT_CATALOGUE.find(product => jfamProductKey(product.name) === key);
}

function jfamProductPrice(name, fallback = 0) {
  const product = jfamCatalogueItem(name);
  return product ? product.price : Number(fallback) || 0;
}

function jfamProductUnit(name, fallback = "") {
  const product = jfamCatalogueItem(name);
  return product ? product.unit : fallback || "";
}

function jfamProductLineTotal(item) {
  const units = Number(item?.packets) || Number(item?.quantity) || 1;
  return jfamProductPrice(item?.product_name || item?.name, item?.price) * units;
}

function jfamOrderCalculatedTotal(order) {
  const items = Array.isArray(order?.order_items) ? order.order_items : Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return Number(order?.total_amount ?? order?.totalAmount) || 0;
  return items.reduce((sum, item) => sum + jfamProductLineTotal(item), 0);
}

window.JFAMPricing = {
  catalogue: JFAM_PRODUCT_CATALOGUE,
  key: jfamProductKey,
  item: jfamCatalogueItem,
  price: jfamProductPrice,
  unit: jfamProductUnit,
  lineTotal: jfamProductLineTotal,
  orderTotal: jfamOrderCalculatedTotal
};
