AdminPages.mount({
  key: "delivery",
  title: "Delivery Partners",
  copy: "Route-by-route performance from the delivery app.",
  status: "Route controls"
}, (app, ui) => {
  app.innerHTML = `
    ${ui.pageCards([
      { label: "Active partners", value: "0", detail: "Partners assigned today" },
      { label: "Open routes", value: "0", detail: "Routes still in progress" },
      { label: "On-time rate", value: "0%", detail: "Delivered within expected window" }
    ])}
    <section class="page-panel">
      <h2>Route controls</h2>
      <div class="page-control-bar">
        <input id="routeSearch" type="search" placeholder="Search partner or route">
        <select id="routeZone">
          <option>All zones</option>
          <option>North</option>
          <option>South</option>
          <option>Central</option>
        </select>
      </div>
      <p class="page-note" id="routeSummary">Showing all zones.</p>
    </section>
    ${ui.pageTable(["Route", "Partner", "Status"], [
      ["North-01", "Partner A", "Open"],
      ["South-02", "Partner B", "Delayed"],
      ["Central-01", "Partner C", "Complete"]
    ])}
  `;

  document.getElementById("routeZone").addEventListener("change", event => {
    document.getElementById("routeSummary").textContent = `Showing ${event.target.value.toLowerCase()} routes.`;
  });
});
