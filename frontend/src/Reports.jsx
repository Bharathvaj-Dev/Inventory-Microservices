import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "./api/apiClient";
import "./Reports.css";

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function isWithinRange(record, field, fromDate, toDate) {
  if (!record[field]) return false;
  const date = new Date(record[field]);
  if (Number.isNaN(date.getTime())) return false;
  const day = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  return (!fromDate || day >= fromDate) && (!toDate || day <= toDate);
}

function downloadCsv(rows, filename) {
  const csv = rows.map((row) => row.map((value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`
  ).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("sold");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    try {
      const [productResponse, purchaseResponse, saleResponse] = await Promise.all([
        apiClient.get("/api/products"),
        apiClient.get("/api/purchases"),
        apiClient.get("/api/sales"),
      ]);
      setProducts(Array.isArray(productResponse.data) ? productResponse.data : []);
      setPurchases(Array.isArray(purchaseResponse.data) ? purchaseResponse.data : []);
      setSales(Array.isArray(saleResponse.data) ? saleResponse.data : []);
      setError("");
    } catch (err) {
      setError(err.response
        ? `Unable to load reports (HTTP ${err.response.status}).`
        : "API Gateway is unreachable. Check service health and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadReports);
  }, [loadReports]);

  const refreshReports = () => {
    setLoading(true);
    void loadReports();
  };

  const productById = useMemo(
    () => new Map(products.map((product) => [String(product.id), product])),
    [products]
  );

  const filteredPurchases = useMemo(
    () => purchases.filter((item) => isWithinRange(item, "purchaseDate", fromDate, toDate)),
    [purchases, fromDate, toDate]
  );
  const filteredSales = useMemo(
    () => sales.filter((item) => isWithinRange(item, "saleDate", fromDate, toDate)),
    [sales, fromDate, toDate]
  );

  const purchaseUnits = filteredPurchases.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  const soldUnits = filteredSales.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);

  const productRows = useMemo(() => {
    const totals = new Map();
    const add = (records, key) => records.forEach((record) => {
      const id = String(record.productId ?? "unknown");
      if (!totals.has(id)) totals.set(id, { productId: id, purchased: 0, sold: 0, purchaseRecords: 0, saleRecords: 0 });
      const row = totals.get(id);
      row[key] += Math.max(0, Number(record.quantity) || 0);
      row[key === "purchased" ? "purchaseRecords" : "saleRecords"] += 1;
    });
    add(filteredPurchases, "purchased");
    add(filteredSales, "sold");
    return [...totals.values()].map((row) => {
      const product = productById.get(row.productId);
      return { ...row, name: product?.name || `Product #${row.productId}`, category: product?.category || product?.categoryName || "Uncategorised" };
    });
  }, [filteredPurchases, filteredSales, productById]);

  const visibleProducts = productRows
    .filter((row) => !search.trim() || row.name.toLowerCase().includes(search.trim().toLowerCase()) || row.productId.includes(search.trim()) || row.category.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => sortBy === "purchased" ? b.purchased - a.purchased : sortBy === "name" ? a.name.localeCompare(b.name) : b.sold - a.sold);

  const categoryRows = useMemo(() => {
    const groups = new Map();
    productRows.forEach((row) => {
      if (!groups.has(row.category)) groups.set(row.category, { category: row.category, purchased: 0, sold: 0, products: 0 });
      const group = groups.get(row.category);
      group.purchased += row.purchased;
      group.sold += row.sold;
      group.products += 1;
    });
    return [...groups.values()].sort((a, b) => b.sold + b.purchased - (a.sold + a.purchased));
  }, [productRows]);

  const exportReport = () => {
    const rows = [
      ["Product ID", "Product Name", "Category", "Purchased Units", "Sold Units", "Purchase Records", "Sale Records"],
      ...visibleProducts.map((row) => [row.productId, row.name, row.category, row.purchased, row.sold, row.purchaseRecords, row.saleRecords]),
    ];
    downloadCsv(rows, "inventory-operations-report.csv");
  };

  const resetFilters = () => { setFromDate(""); setToDate(""); setSearch(""); setSortBy("sold"); };

  return (
    <main className="ops-content reports-content">
      <header className="ops-page-header">
        <div>
          <span className="ops-eyebrow">BUSINESS INSIGHTS</span>
          <h1>Reports &amp; Analytics</h1>
          <p>Explore purchase and sales activity with product and category breakdowns.</p>
        </div>
        <div className="reports-header-actions">
          <button className="ops-button ops-button-light" onClick={refreshReports} disabled={loading}>↻ Refresh</button>
          <button className="ops-button ops-button-primary" onClick={exportReport} disabled={loading || !visibleProducts.length}>↓ Export CSV</button>
        </div>
      </header>

      {error && <p className="ops-notice ops-error" role="alert">{error}</p>}

      <section className="reports-filter-panel" aria-label="Report filters">
        <label>From date<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label>To date<input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></label>
        <button className="ops-button ops-button-light" onClick={resetFilters}>Clear filters</button>
      </section>

      <section className="reports-metrics">
        <article className="reports-metric"><span className="reports-metric-icon purchase">↓</span><div><small>Purchase records</small><strong>{loading ? "—" : formatNumber(filteredPurchases.length)}</strong><span>{formatNumber(purchaseUnits)} units received</span></div></article>
        <article className="reports-metric"><span className="reports-metric-icon sale">↗</span><div><small>Sales records</small><strong>{loading ? "—" : formatNumber(filteredSales.length)}</strong><span>{formatNumber(soldUnits)} units sold</span></div></article>
        <article className="reports-metric"><span className="reports-metric-icon balance">⇄</span><div><small>Net unit movement</small><strong>{loading ? "—" : formatNumber(purchaseUnits - soldUnits)}</strong><span>Purchased units minus sold units</span></div></article>
        <article className="reports-metric"><span className="reports-metric-icon products">▦</span><div><small>Products with activity</small><strong>{loading ? "—" : formatNumber(productRows.length)}</strong><span>Across selected date range</span></div></article>
      </section>

      <section className="ops-panel reports-panel">
        <div className="ops-panel-heading"><div><h2>Product performance</h2><p>Purchase and sales quantities grouped by product.</p></div><span className="ops-pill ops-pill-info">{visibleProducts.length} products</span></div>
        <div className="reports-toolbar">
          <input aria-label="Search report products" placeholder="Search product, ID or category..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Sort product report" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="sold">Highest sold</option><option value="purchased">Highest purchased</option><option value="name">Product name</option>
          </select>
        </div>
        {loading ? <div className="ops-empty">Loading report data...</div> : !visibleProducts.length ? <div className="ops-empty">No product activity found for the selected filters.</div> : (
          <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Product</th><th>Category</th><th>Purchased units</th><th>Sold units</th><th>Purchase records</th><th>Sale records</th></tr></thead>
            <tbody>{visibleProducts.map((row) => <tr key={row.productId}><td><strong>{row.name}</strong><small className="reports-subtext">ID #{row.productId}</small></td><td>{row.category}</td><td>{formatNumber(row.purchased)}</td><td>{formatNumber(row.sold)}</td><td>{formatNumber(row.purchaseRecords)}</td><td>{formatNumber(row.saleRecords)}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>

      <section className="ops-panel reports-panel">
        <div className="ops-panel-heading"><div><h2>Category breakdown</h2><p>Combined purchase and sales quantities by product category.</p></div><span className="ops-pill ops-pill-info">{categoryRows.length} categories</span></div>
        {loading ? <div className="ops-empty">Loading category report...</div> : !categoryRows.length ? <div className="ops-empty">No category activity found for the selected filters.</div> : (
          <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Category</th><th>Products</th><th>Purchased units</th><th>Sold units</th><th>Total movement</th></tr></thead>
            <tbody>{categoryRows.map((row) => <tr key={row.category}><td><strong>{row.category}</strong></td><td>{formatNumber(row.products)}</td><td>{formatNumber(row.purchased)}</td><td>{formatNumber(row.sold)}</td><td>{formatNumber(row.purchased + row.sold)}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
      <p className="ops-footnote">Reports use transaction quantities and dates returned by the API Gateway. Revenue and profit are not calculated because transaction-level selling prices are not available in these records.</p>
    </main>
  );
}
