import { useCallback, useEffect, useState } from "react";
import apiClient from "./api/apiClient";
import "./OperationsPages.css";

function Notice({ error, success }) {
  return <>{error && <p className="ops-notice ops-error" role="alert">{error}</p>}{success && <p className="ops-notice ops-success" role="status">{success}</p>}</>;
}

function PageHeader({ eyebrow, title, description, action }) {
  return <div className="ops-page-header"><div><span className="ops-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Metric({ label, value, detail, icon }) {
  return <article className="ops-metric"><span className="ops-metric-icon">{icon}</span><div><span className="ops-metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function DashboardPage() {
  const [data, setData] = useState({ products: [], inventory: [], purchases: [], sales: [], queues: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const endpoints = ["/api/products", "/api/inventory", "/api/purchases", "/api/sales", "/api/admin/queue-stats"];
    const results = await Promise.allSettled(endpoints.map((url) => apiClient.get(url)));
    const next = {};
    const keys = ["products", "inventory", "purchases", "sales", "queues"];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const value = result.value.data;
        next[keys[index]] = index === 4 ? value : (Array.isArray(value) ? value : []);
      } else {
        next[keys[index]] = index === 4 ? null : [];
      }
    });
    setData(next);
    const failed = results.filter((item) => item.status === "rejected").length;
    setError(failed ? `${failed} dashboard data source(s) unavailable. Check service health and refresh.` : "");
    setLoading(false);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void refresh(); }, 0);
    const interval = window.setInterval(refresh, 30000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const lowStock = data.inventory.filter((item) => Number(item.currentStock) > 0 && Number(item.currentStock) < 10);
  const outOfStock = data.inventory.filter((item) => Number(item.currentStock) <= 0);
  const inStock = data.inventory.filter((item) => Number(item.currentStock) >= 10);
  const queueMessages = data.queues ? Object.entries(data.queues).filter(([key, value]) => key !== "queueCount" && value && typeof value === "object").reduce((sum, [, value]) => sum + Number(value.messages || 0), 0) : "—";

  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - (5 - index));
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en", { month: "short" }),
      purchases: 0,
      sales: 0,
    };
  });
  const monthMap = new Map(monthBuckets.map((month) => [month.key, month]));
  const addMonthlyQuantity = (records, dateField, metric) => {
    records.forEach((record) => {
      if (!record[dateField]) return;
      const date = new Date(record[dateField]);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap.get(key);
      if (bucket) bucket[metric] += Math.max(0, Number(record.quantity) || 0);
    });
  };
  addMonthlyQuantity(data.purchases, "purchaseDate", "purchases");
  addMonthlyQuantity(data.sales, "saleDate", "sales");
  const monthlyMax = Math.max(1, ...monthBuckets.flatMap((month) => [month.purchases, month.sales]));

  const topProducts = Object.values(data.sales.reduce((totals, sale) => {
    const id = String(sale.productId ?? "unknown");
    if (!totals[id]) totals[id] = { productId: id, quantity: 0, transactions: 0 };
    totals[id].quantity += Math.max(0, Number(sale.quantity) || 0);
    totals[id].transactions += 1;
    return totals;
  }, {})).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const topProductMax = Math.max(1, ...topProducts.map((item) => item.quantity));
  const stockTotal = data.inventory.length;
  const stockSegments = [
    { label: "In stock", count: inStock.length, className: "ops-stock-in" },
    { label: "Low stock", count: lowStock.length, className: "ops-stock-low" },
    { label: "Out of stock", count: outOfStock.length, className: "ops-stock-out" },
  ];

  return <main className="ops-content">
    <PageHeader eyebrow="OVERVIEW" title="Dashboard" description="A live overview of your inventory operations." action={<button className="ops-button ops-button-light" onClick={refresh}>↻ Refresh</button>} />
    <Notice error={error} />
    <div className="ops-metric-grid">
      <Metric label="Total products" value={loading ? "—" : data.products.length} detail="Product catalogue" icon="▦" />
      <Metric label="Inventory items" value={loading ? "—" : data.inventory.length} detail="Tracked stock records" icon="▤" />
      <Metric label="Low stock alerts" value={loading ? "—" : lowStock.length} detail="1–9 units available" icon="⚑" />
      <Metric label="Purchase records" value={loading ? "—" : data.purchases.length} detail="Replenishment history" icon="↓" />
      <Metric label="Sales records" value={loading ? "—" : data.sales.length} detail="Completed sale records" icon="↗" />
      <Metric label="Queue messages" value={queueMessages} detail="Across monitored SQS queues" icon="☁" />
    </div>

    <div className="ops-analytics-grid">
      <section className="ops-panel ops-analytics-panel">
        <div className="ops-panel-heading"><div><h2>Purchase vs Sales trend</h2><p>Monthly quantity movement · Last 6 months</p></div><div className="ops-chart-legend"><span><i className="ops-legend-purchase" /> Purchases</span><span><i className="ops-legend-sales" /> Sales</span></div></div>
        {loading ? <div className="ops-empty">Loading transaction analytics...</div> : !data.purchases.length && !data.sales.length ? <div className="ops-empty">No transaction data available yet.</div> : <div className="ops-month-chart" role="img" aria-label="Monthly purchase and sales quantities for the last six months">
          {monthBuckets.map((month) => <div className="ops-month-column" key={month.key}>
            <div className="ops-month-bars">
              <div className="ops-month-bar ops-month-bar-purchase" style={{ height: `${month.purchases / monthlyMax * 100}%` }} title={`Purchases: ${month.purchases}`} />
              <div className="ops-month-bar ops-month-bar-sales" style={{ height: `${month.sales / monthlyMax * 100}%` }} title={`Sales: ${month.sales}`} />
            </div>
            <span>{month.label}</span>
            <small>{month.purchases + month.sales}</small>
          </div>)}
        </div>}
      </section>

      <section className="ops-panel ops-analytics-panel">
        <div className="ops-panel-heading"><div><h2>Stock distribution</h2><p>Inventory status by available units</p></div><span className="ops-pill ops-pill-info">{stockTotal} records</span></div>
        {loading ? <div className="ops-empty">Loading stock analytics...</div> : !stockTotal ? <div className="ops-empty">No inventory records available.</div> : <>
          <div className="ops-stock-track" role="img" aria-label={stockSegments.map((item) => `${item.label}: ${item.count}`).join(", ")}>
            {stockSegments.map((item) => <span key={item.label} className={item.className} style={{ width: `${item.count / stockTotal * 100}%` }} />)}
          </div>
          <div className="ops-stock-list">{stockSegments.map((item) => <div className="ops-stock-row" key={item.label}><span><i className={item.className} />{item.label}</span><strong>{item.count}<small>{Math.round(item.count / stockTotal * 100)}%</small></strong></div>)}</div>
        </>}
      </section>
    </div>

    <section className="ops-panel">
      <div className="ops-panel-heading"><div><h2>Top-selling products</h2><p>Ranked by total quantity sold across completed sales.</p></div><span className="ops-pill ops-pill-info">Top 5</span></div>
      {loading ? <div className="ops-empty">Loading product performance...</div> : !topProducts.length ? <div className="ops-empty">No completed sales available to rank products.</div> : <div className="ops-top-products">{topProducts.map((item, index) => {
        const product = data.products.find((entry) => String(entry.id) === item.productId);
        return <div className="ops-top-product" key={item.productId}>
          <span className="ops-top-rank">{index + 1}</span>
          <div className="ops-top-product-info"><div><strong>{product?.name || `Product #${item.productId}`}</strong><small>Product #{item.productId} · {item.transactions} sale{item.transactions === 1 ? "" : "s"}</small></div><div className="ops-top-track"><span style={{ width: `${item.quantity / topProductMax * 100}%` }} /></div></div>
          <strong className="ops-top-quantity">{item.quantity}<small>units</small></strong>
        </div>;
      })}</div>}
    </section>

    <section className="ops-panel">
      <div className="ops-panel-heading"><div><h2>Low stock overview</h2><p>Inventory items with fewer than 10 units available.</p></div><span className={lowStock.length ? "ops-pill ops-pill-warning" : "ops-pill ops-pill-good"}>{lowStock.length} items</span></div>
      {loading ? <div className="ops-empty">Loading inventory...</div> : lowStock.length === 0 ? <div className="ops-empty">No low-stock items found.</div> : <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Product ID</th><th>Current stock</th><th>Last updated</th><th>Status</th></tr></thead><tbody>{lowStock.slice(0, 8).map((item) => <tr key={item.id}><td>#{item.productId}</td><td>{item.currentStock}</td><td>{formatDate(item.lastUpdated)}</td><td><span className="ops-pill ops-pill-warning">Low stock</span></td></tr>)}</tbody></table></div>}
    </section>

    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>Recent activity</h2><p>Latest purchase and sales transactions.</p></div></div><div className="ops-activity-grid"><div><h3>Purchases</h3>{data.purchases.slice(-5).reverse().map((item) => <div className="ops-activity-row" key={item.purchaseId}><span className="ops-activity-icon">↓</span><div><strong>Purchase #{item.purchaseId}</strong><small>Product #{item.productId} · Qty {item.quantity}</small></div><time>{formatDate(item.purchaseDate)}</time></div>)}{!data.purchases.length && <p className="ops-muted">No purchase records yet.</p>}</div><div><h3>Sales</h3>{data.sales.slice(-5).reverse().map((item) => <div className="ops-activity-row" key={item.saleId}><span className="ops-activity-icon ops-activity-sale">↗</span><div><strong>Sale #{item.saleId}</strong><small>Product #{item.productId} · Qty {item.quantity}</small></div><time>{formatDate(item.saleDate)}</time></div>)}{!data.sales.length && <p className="ops-muted">No completed sales yet.</p>}</div></div></section>
    <p className="ops-footnote">Dashboard data refreshes automatically every 30 seconds. Values are read from the API Gateway.</p>
  </main>;
}
export function InventoryPage() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: "", currentStock: "" });
  const [editing, setEditing] = useState(null);
  const [threshold, setThreshold] = useState(10);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const pageSize = 8;

  const load = useCallback(async () => {
    try {
      const [inventoryResponse, productResponse] = await Promise.all([apiClient.get("/api/inventory"), apiClient.get("/api/products")]);
      setItems(Array.isArray(inventoryResponse.data) ? inventoryResponse.data : []);
      setProducts(Array.isArray(productResponse.data) ? productResponse.data : []);
      setError("");
    } catch (err) {
      setError(err.response ? `Unable to load inventory (HTTP ${err.response.status}).` : "API Gateway is unreachable.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  const productById = new Map(products.map((product) => [String(product.id), product]));
  const getStockStatus = (item) => Number(item.currentStock) <= 0 ? "out" : Number(item.currentStock) < Number(threshold) ? "low" : "in";
  const filteredItems = items.filter((item) => {
    const product = productById.get(String(item.productId));
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || String(item.productId).includes(query) || String(product?.name || "").toLowerCase().includes(query);
    const matchesCategory = category === "all" || String(product?.category || product?.categoryName || "") === category;
    const matchesStatus = status === "all" || getStockStatus(item) === status;
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sort === "stock-asc") return Number(a.currentStock) - Number(b.currentStock);
    if (sort === "stock-desc") return Number(b.currentStock) - Number(a.currentStock);
    if (sort === "name") return String(productById.get(String(a.productId))?.name || "").localeCompare(String(productById.get(String(b.productId))?.name || ""));
    return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
  });
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const lowCount = items.filter((item) => getStockStatus(item) === "low").length;
  const outCount = items.filter((item) => getStockStatus(item) === "out").length;
  const totalUnits = items.reduce((sum, item) => sum + Math.max(0, Number(item.currentStock) || 0), 0);
  const categories = [...new Set(products.map((product) => product.category || product.categoryName).filter(Boolean))].sort();

  const reset = () => { setForm({ productId: "", currentStock: "" }); setEditing(null); };
  const exportCsv = () => {
    const rows = [["Record ID", "Product ID", "Product Name", "Category", "Current Stock", "Status", "Last Updated"], ...filteredItems.map((item) => {
      const product = productById.get(String(item.productId));
      return [item.id, item.productId, product?.name || "", product?.category || product?.categoryName || "", item.currentStock, getStockStatus(item), item.lastUpdated || ""];
    })];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    const payload = { productId: Number(form.productId), currentStock: Number(form.currentStock) };
    try {
      if (editing) { await apiClient.put(`/api/inventory/${editing}`, payload); setSuccess("Stock updated successfully."); }
      else { await apiClient.post("/api/inventory", payload); setSuccess("Inventory item created successfully."); }
      reset(); await load();
    } catch (err) { setError(err.response?.data?.message || (err.response ? `Save failed (HTTP ${err.response.status}).` : "Unable to reach API Gateway.")); }
    finally { setSaving(false); }
  }

  async function remove(item) {
    if (!window.confirm(`Delete inventory record for product #${item.productId}?`)) return;
    try { await apiClient.delete(`/api/inventory/${item.productId}`); setSuccess("Inventory record deleted."); await load(); }
    catch (err) { setError(err.response?.data?.message || "Unable to delete inventory record."); }
  }

  return <main className="ops-content">
    <PageHeader eyebrow="STOCK CONTROL" title="Inventory Management" description="Monitor stock levels, identify risks, and manage inventory records." action={<div className="ops-header-actions"><button className="ops-button ops-button-light" onClick={load}>↻ Refresh</button><button className="ops-button ops-button-primary" onClick={exportCsv} disabled={!filteredItems.length}>↓ Export CSV</button></div>} />
    <Notice error={error} success={success} />
    <div className="ops-inventory-summary">
      <Metric label="Inventory records" value={loading ? "—" : items.length} detail="Tracked product stocks" icon="▤" />
      <Metric label="Total units" value={loading ? "—" : totalUnits.toLocaleString()} detail="Available stock quantity" icon="▦" />
      <Metric label="Low stock" value={loading ? "—" : lowCount} detail={`Below ${threshold} units`} icon="⚑" />
      <Metric label="Out of stock" value={loading ? "—" : outCount} detail="Zero available units" icon="!" />
    </div>
    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>{editing ? `Update product #${editing}` : "Add inventory record"}</h2><p>Inventory is tracked by product ID and current stock.</p></div></div>
      <form className="ops-form ops-form-inline" onSubmit={submit}>
        <label>Product<select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required disabled={!!editing}><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.name}</option>)}</select></label>
        <label>Current stock<input type="number" min="0" step="1" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} required /></label>
        <div className="ops-form-actions"><button className="ops-button ops-button-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save stock" : "Add record"}</button>{editing && <button type="button" className="ops-button ops-button-light" onClick={reset}>Cancel</button>}</div>
      </form>
    </section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>Stock records</h2><p>Showing {filteredItems.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} matching records</p></div><label className="ops-threshold-control">Low-stock threshold<input type="number" min="1" value={threshold} onChange={(e) => { setThreshold(Math.max(1, Number(e.target.value) || 1)); setPage(1); }} /></label></div>
      <div className="ops-inventory-toolbar">
        <input className="ops-search-input" type="search" placeholder="Search product name or ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search inventory" />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category"><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by stock status"><option value="all">All stock statuses</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort inventory"><option value="updated">Recently updated</option><option value="name">Product name</option><option value="stock-asc">Stock: low to high</option><option value="stock-desc">Stock: high to low</option></select>
      </div>
      {loading ? <div className="ops-empty">Loading inventory...</div> : !filteredItems.length ? <div className="ops-empty">No inventory records match these filters.</div> : <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Record ID</th><th>Product</th><th>Category</th><th>Current stock</th><th>Last updated</th><th>Status</th><th>Actions</th></tr></thead><tbody>{pageItems.map((item) => {
        const product = productById.get(String(item.productId));
        const stockStatus = getStockStatus(item);
        return <tr key={item.id}><td>#{item.id}</td><td><strong>{product?.name || `Product #${item.productId}`}</strong><small className="ops-cell-subtitle">ID #{item.productId}</small></td><td>{product?.category || product?.categoryName || "—"}</td><td><strong>{item.currentStock}</strong></td><td>{formatDate(item.lastUpdated)}</td><td><span className={stockStatus === "out" ? "ops-pill ops-pill-danger" : stockStatus === "low" ? "ops-pill ops-pill-warning" : "ops-pill ops-pill-good"}>{stockStatus === "out" ? "Out of stock" : stockStatus === "low" ? "Low stock" : "In stock"}</span></td><td><div className="ops-row-actions"><button className="ops-link-button" onClick={() => { setEditing(item.productId); setForm({ productId: String(item.productId), currentStock: String(item.currentStock) }); }}>Edit</button><button className="ops-link-button ops-danger-text" onClick={() => remove(item)}>Delete</button></div></td></tr>;
      })}</tbody></table></div>}
      {!loading && filteredItems.length > pageSize && <div className="ops-pagination"><span>Page {currentPage} of {pageCount}</span><div><button className="ops-button ops-button-light" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>Previous</button><button className="ops-button ops-button-light" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>Next</button></div></div>}
    </section>
  </main>;
}

function TransactionPage({ type }) {
  const isPurchase = type === "purchase";
  const endpoint = isPurchase ? "/api/purchases" : "/api/sales";
  const PAGE_SIZE = 8;
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: "", quantity: "1" });
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const [recordResponse, productResponse] = await Promise.all([apiClient.get(endpoint), apiClient.get("/api/products")]);
      setRecords(Array.isArray(recordResponse.data) ? recordResponse.data : []);
      setProducts(Array.isArray(productResponse.data) ? productResponse.data : []);
      setError("");
    } catch (err) { setError(err.response ? `Unable to load records (HTTP ${err.response.status}).` : "API Gateway is unreachable."); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  const productById = new Map(products.map((product) => [String(product.id), product]));
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const filteredRecords = isPurchase ? records.filter((item) => {
    const query = search.trim().toLowerCase();
    const product = productById.get(String(item.productId));
    const matchesSearch = !query || String(item.purchaseId).toLowerCase().includes(query) ||
      String(item.productId).toLowerCase().includes(query) || String(product?.name || "").toLowerCase().includes(query);
    const purchaseDate = new Date(item.purchaseDate);
    const matchesDate = dateFilter === "all" ||
      (!Number.isNaN(purchaseDate.getTime()) && (dateFilter === "today"
        ? purchaseDate >= todayStart
        : purchaseDate >= new Date(todayStart.getTime() - (dateFilter === "7days" ? 7 : 30) * 24 * 60 * 60 * 1000)));
    return matchesSearch && matchesDate;
  }) : records;
  const sortedRecords = isPurchase ? [...filteredRecords].sort((a, b) => {
    if (sortBy === "quantity-high") return Number(b.quantity) - Number(a.quantity);
    if (sortBy === "quantity-low") return Number(a.quantity) - Number(b.quantity);
    const aDate = new Date(a.purchaseDate || 0).getTime();
    const bDate = new Date(b.purchaseDate || 0).getTime();
    return sortBy === "oldest" ? aDate - bDate : bDate - aDate;
  }) : records;
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = isPurchase ? sortedRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) : records;
  const totalUnits = records.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  const todayPurchases = records.filter((item) => {
    const date = new Date(item.purchaseDate);
    return !Number.isNaN(date.getTime()) && date >= todayStart;
  }).length;
  const uniqueProducts = new Set(records.map((item) => String(item.productId))).size;

  const exportPurchases = () => {
    const rows = [["Purchase ID", "Product ID", "Product Name", "Quantity", "Purchase Date"], ...sortedRecords.map((item) => [
      item.purchaseId, item.productId, productById.get(String(item.productId))?.name || "", item.quantity, item.purchaseDate || ""
    ])];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\\r\\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "purchases-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const response = await apiClient.post(endpoint, { productId: Number(form.productId), quantity: Number(form.quantity) });
      setSuccess(isPurchase ? "Purchase request submitted. Stock replenishment is processed by the event workflow." : (typeof response.data === "string" ? response.data : "Sale request accepted. Stock reservation is processing asynchronously."));
      setForm({ productId: "", quantity: "1" });
      if (isPurchase) await load();
      else setTimeout(load, 1800);
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.detail || (err.response ? `Request failed (HTTP ${err.response.status}).` : "Unable to reach API Gateway.")); }
    finally { setSaving(false); }
  }

  const title = isPurchase ? "Purchases" : "Sales";
  return <main className="ops-content">
    <PageHeader eyebrow={isPurchase ? "REPLENISHMENT" : "ORDER PROCESSING"} title={title} description={isPurchase ? "Create purchase requests to replenish product stock." : "Submit sales and track their asynchronous processing."} action={<button className="ops-button ops-button-light" onClick={load}>↻ Refresh</button>} />
    <Notice error={error} success={success} />
    {isPurchase && <div className="ops-metric-grid ops-purchase-metrics">
      <Metric label="Total purchases" value={loading ? "—" : records.length} detail="Purchase transactions" icon="↓" />
      <Metric label="Total units" value={loading ? "—" : totalUnits.toLocaleString()} detail="Units replenished" icon="▦" />
      <Metric label="Today's purchases" value={loading ? "—" : todayPurchases} detail="Transactions today" icon="◷" />
      <Metric label="Unique products" value={loading ? "—" : uniqueProducts} detail="Products purchased" icon="▤" />
    </div>}
    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>Create {isPurchase ? "purchase" : "sale"} request</h2><p>Choose a product and enter the required quantity.</p></div><span className="ops-pill ops-pill-info">{isPurchase ? "Stock replenishment" : "Saga workflow"}</span></div>
      <form className="ops-form ops-form-inline" onSubmit={submit}>
        <label>Product<select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.name}</option>)}</select></label>
        <label>Quantity<input type="number" min="1" step="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></label>
        <div className="ops-form-actions"><button className="ops-button ops-button-primary" disabled={saving || !products.length}>{saving ? "Submitting..." : `Submit ${isPurchase ? "purchase" : "sale"}`}</button></div>
      </form>
      {!products.length && !loading && <p className="ops-muted">Create a product first before submitting a transaction.</p>}
    </section>
    <section className="ops-panel">
      <div className="ops-panel-heading"><div><h2>{title} history</h2><p>{isPurchase ? `${filteredRecords.length} of ${records.length} records` : `${records.length} records returned by the service.`}</p></div>
        {isPurchase && <button className="ops-button ops-button-light" onClick={exportPurchases} disabled={!sortedRecords.length}>↓ Export CSV</button>}
      </div>
      {isPurchase && <div className="ops-purchase-toolbar">
        <input aria-label="Search purchases" placeholder="Search purchase ID, product ID or name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select aria-label="Filter purchase date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}>
          <option value="all">All dates</option><option value="today">Today</option><option value="7days">Last 7 days</option><option value="30days">Last 30 days</option>
        </select>
        <select aria-label="Sort purchases" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="quantity-high">Highest quantity</option><option value="quantity-low">Lowest quantity</option>
        </select>
      </div>}
      {loading ? <div className="ops-empty">Loading {title.toLowerCase()}...</div> : !(isPurchase ? sortedRecords.length : records.length) ? <div className="ops-empty">{isPurchase && records.length ? "No purchases match your filters." : `No ${title.toLowerCase()} records found yet.`}</div> :
        <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Transaction ID</th><th>Product ID</th>{isPurchase && <th>Product name</th>}<th>Quantity</th><th>Date</th>{!isPurchase && <th>Saga ID</th>}</tr></thead><tbody>
          {(isPurchase ? paginatedRecords : [...records].reverse()).map((item) => {
            const product = productById.get(String(item.productId));
            return <tr key={isPurchase ? item.purchaseId : item.saleId}><td>#{isPurchase ? item.purchaseId : item.saleId}</td><td>#{item.productId}</td>{isPurchase && <td>{product?.name || "—"}</td>}<td>{item.quantity}</td><td>{formatDate(isPurchase ? item.purchaseDate : item.saleDate)}</td>{!isPurchase && <td className="ops-saga-id">{item.sagaId || "—"}</td>}</tr>;
          })}
        </tbody></table></div>}
      {isPurchase && sortedRecords.length > PAGE_SIZE && <div className="ops-pagination">
        <span>Page {currentPage} of {totalPages} · {sortedRecords.length} purchases</span>
        <div><button className="ops-button ops-button-light" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>Previous</button>
          <button className="ops-button ops-button-light" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages}>Next</button></div>
      </div>}
    </section>
    <p className="ops-footnote">{isPurchase ? "Purchase requests are handled by the purchase service and its event-driven stock workflow." : "Sale requests return HTTP 202 and start a stock-reservation saga. A new sale record appears after successful processing."}</p>
  </main>;
}

export function PurchasesPage() { return <TransactionPage type="purchase" />; }
export function SalesPage() { return <TransactionPage type="sale" />; }
