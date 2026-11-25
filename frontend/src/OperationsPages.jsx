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
      if (result.status === "fulfilled") next[keys[index]] = result.value.data;
      else next[keys[index]] = index === 4 ? null : [];
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

  const lowStock = data.inventory.filter((item) => Number(item.currentStock) < 10);
  const queueMessages = data.queues ? Object.entries(data.queues).filter(([key, value]) => key !== "queueCount" && value && typeof value === "object").reduce((sum, [, value]) => sum + Number(value.messages || 0), 0) : "—";

  return <main className="ops-content">
    <PageHeader eyebrow="OVERVIEW" title="Dashboard" description="A live overview of your inventory operations." action={<button className="ops-button ops-button-light" onClick={refresh}>↻ Refresh</button>} />
    <Notice error={error} />
    <div className="ops-metric-grid">
      <Metric label="Total products" value={loading ? "—" : data.products.length} detail="Product catalogue" icon="▦" />
      <Metric label="Inventory items" value={loading ? "—" : data.inventory.length} detail="Tracked stock records" icon="▤" />
      <Metric label="Low stock alerts" value={loading ? "—" : lowStock.length} detail="Below 10 units" icon="⚑" />
      <Metric label="Purchase records" value={loading ? "—" : data.purchases.length} detail="Replenishment history" icon="↓" />
      <Metric label="Sales records" value={loading ? "—" : data.sales.length} detail="Completed sale records" icon="↗" />
      <Metric label="Queue messages" value={queueMessages} detail="Across monitored SQS queues" icon="☁" />
    </div>
    <section className="ops-panel">
      <div className="ops-panel-heading"><div><h2>Low stock overview</h2><p>Inventory items with fewer than 10 units available.</p></div><span className={lowStock.length ? "ops-pill ops-pill-warning" : "ops-pill ops-pill-good"}>{lowStock.length} items</span></div>
      {lowStock.length === 0 ? <div className="ops-empty">No low-stock items found, or inventory data is not available.</div> : <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Product ID</th><th>Current stock</th><th>Last updated</th><th>Status</th></tr></thead><tbody>{lowStock.slice(0, 8).map((item) => <tr key={item.id}><td>#{item.productId}</td><td>{item.currentStock}</td><td>{formatDate(item.lastUpdated)}</td><td><span className="ops-pill ops-pill-warning">Low stock</span></td></tr>)}</tbody></table></div>}
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
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const visible = lowOnly ? items.filter((item) => Number(item.currentStock) <= Number(threshold)) : items;
  const reset = () => { setForm({ productId: "", currentStock: "" }); setEditing(null); };

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
    <PageHeader eyebrow="STOCK CONTROL" title="Inventory" description="Track available stock and monitor low-stock items." action={<button className="ops-button ops-button-light" onClick={load}>↻ Refresh</button>} />
    <Notice error={error} success={success} />
    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>{editing ? `Update product #${editing}` : "Add inventory record"}</h2><p>Inventory is tracked by product ID and current stock.</p></div></div>
      <form className="ops-form ops-form-inline" onSubmit={submit}>
        <label>Product<select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required disabled={!!editing}><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.name}</option>)}</select></label>
        <label>Current stock<input type="number" min="0" step="1" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} required /></label>
        <div className="ops-form-actions"><button className="ops-button ops-button-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save stock" : "Add record"}</button>{editing && <button type="button" className="ops-button ops-button-light" onClick={reset}>Cancel</button>}</div>
      </form>
    </section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>Stock records</h2><p>{visible.length} of {items.length} inventory records</p></div><div className="ops-filter"><label><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only</label><input aria-label="Low stock threshold" type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></div></div>
      {loading ? <div className="ops-empty">Loading inventory...</div> : !visible.length ? <div className="ops-empty">No inventory records found.</div> : <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Record ID</th><th>Product ID</th><th>Current stock</th><th>Last updated</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td>#{item.id}</td><td>#{item.productId}</td><td><strong>{item.currentStock}</strong></td><td>{formatDate(item.lastUpdated)}</td><td><span className={Number(item.currentStock) <= Number(threshold) ? "ops-pill ops-pill-warning" : "ops-pill ops-pill-good"}>{Number(item.currentStock) <= Number(threshold) ? "Low stock" : "In stock"}</span></td><td><div className="ops-row-actions"><button className="ops-link-button" onClick={() => { setEditing(item.productId); setForm({ productId: String(item.productId), currentStock: String(item.currentStock) }); }}>Edit</button><button className="ops-link-button ops-danger-text" onClick={() => remove(item)}>Delete</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}

function TransactionPage({ type }) {
  const isPurchase = type === "purchase";
  const endpoint = isPurchase ? "/api/purchases" : "/api/sales";
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: "", quantity: "1" });
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

  useEffect(() => { load(); }, [load]);

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
    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>Create {isPurchase ? "purchase" : "sale"} request</h2><p>Choose a product and enter the required quantity.</p></div><span className="ops-pill ops-pill-info">{isPurchase ? "Stock replenishment" : "Saga workflow"}</span></div>
      <form className="ops-form ops-form-inline" onSubmit={submit}>
        <label>Product<select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>#{p.id} · {p.name}</option>)}</select></label>
        <label>Quantity<input type="number" min="1" step="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></label>
        <div className="ops-form-actions"><button className="ops-button ops-button-primary" disabled={saving || !products.length}>{saving ? "Submitting..." : `Submit ${isPurchase ? "purchase" : "sale"}`}</button></div>
      </form>
      {!products.length && !loading && <p className="ops-muted">Create a product first before submitting a transaction.</p>}
    </section>
    <section className="ops-panel"><div className="ops-panel-heading"><div><h2>{title} history</h2><p>{records.length} records returned by the service.</p></div></div>
      {loading ? <div className="ops-empty">Loading {title.toLowerCase()}...</div> : !records.length ? <div className="ops-empty">No {title.toLowerCase()} records found yet.</div> : <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Transaction ID</th><th>Product ID</th><th>Quantity</th><th>Date</th>{!isPurchase && <th>Saga ID</th>}</tr></thead><tbody>{[...records].reverse().map((item) => <tr key={isPurchase ? item.purchaseId : item.saleId}><td>#{isPurchase ? item.purchaseId : item.saleId}</td><td>#{item.productId}</td><td>{item.quantity}</td><td>{formatDate(isPurchase ? item.purchaseDate : item.saleDate)}</td>{!isPurchase && <td className="ops-saga-id">{item.sagaId || "—"}</td>}</tr>)}</tbody></table></div>}
    </section>
    <p className="ops-footnote">{isPurchase ? "Purchase requests are handled by the purchase service and its event-driven stock workflow." : "Sale requests return HTTP 202 and start a stock-reservation saga. A new sale record appears after successful processing."}</p>
  </main>;
}

export function PurchasesPage() { return <TransactionPage type="purchase" />; }
export function SalesPage() { return <TransactionPage type="sale" />; }
