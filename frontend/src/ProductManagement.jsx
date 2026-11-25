import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "./api/apiClient";
import "./ProductManagement.css";

const EMPTY_FORM = { name: "", description: "", price: "", quantity: "", category: "" };

function categoryName(value) {
  if (typeof value === "string") return value;
  return value?.name || "";
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })
    : "—";
}

function stockState(quantity) {
  const count = Number(quantity ?? 0);
  if (count <= 0) return { label: "Out of stock", className: "pm-stock-out" };
  if (count <= 10) return { label: "Low stock", className: "pm-stock-low" };
  return { label: "In stock", className: "pm-stock-good" };
}

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/products");
      setProducts(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      setError(err.response
        ? "Unable to load products (HTTP " + err.response.status + "). Check Product Service and API Gateway."
        : "API Gateway is unreachable. Check that the backend services are running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void loadProducts(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadProducts]);

  const categories = useMemo(() => [...new Set(products.map((item) => categoryName(item.category)).filter(Boolean))].sort(), [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((item) => {
      const matchesSearch = !term || [item.name, item.description, item.id, categoryName(item.category)]
        .some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesCategory = categoryFilter === "all" || categoryName(item.category) === categoryFilter;
      const quantity = Number(item.quantity ?? 0);
      const matchesStock = stockFilter === "all"
        || (stockFilter === "out" && quantity <= 0)
        || (stockFilter === "low" && quantity > 0 && quantity <= 10)
        || (stockFilter === "available" && quantity > 10);
      return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      if (sortBy === "price-low") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "price-high") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "stock-low") return Number(a.quantity || 0) - Number(b.quantity || 0);
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [products, search, categoryFilter, stockFilter, sortBy]);

  const summary = useMemo(() => ({
    total: products.length,
    low: products.filter((item) => Number(item.quantity ?? 0) > 0 && Number(item.quantity ?? 0) <= 10).length,
    out: products.filter((item) => Number(item.quantity ?? 0) <= 0).length,
    value: products.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
  }), [products]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: product.price ?? "",
      quantity: product.quantity ?? "",
      category: categoryName(product.category),
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
      category: form.category.trim() || null,
    };
    try {
      if (editingId === null) {
        await apiClient.post("/api/products", payload);
        setSuccess("Product created successfully.");
      } else {
        await apiClient.put("/api/products/" + editingId, payload);
        setSuccess("Product updated successfully.");
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message
        || (err.response ? "Save failed (HTTP " + err.response.status + ")." : "Unable to reach API Gateway."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm("Delete \"" + product.name + "\" (ID: " + product.id + ")? This cannot be undone.")) return;
    setError("");
    setSuccess("");
    try {
      await apiClient.delete("/api/products/" + product.id);
      setSuccess("\"" + product.name + "\" deleted successfully.");
      if (editingId === product.id) resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message
        || (err.response ? "Delete failed (HTTP " + err.response.status + ")." : "Unable to reach API Gateway."));
    }
  }

  return (
    <main className="pm-page">
      <header className="pm-heading">
        <div><span className="pm-eyebrow">CATALOGUE MANAGEMENT</span><h1>Products</h1><p>Manage your product catalogue, pricing and stock availability.</p></div>
        <button type="button" className="pm-button pm-button-outline" onClick={loadProducts} disabled={loading}>↻ Refresh</button>
      </header>

      <section className="pm-summary" aria-label="Product summary">
        <article className="pm-summary-card"><span className="pm-summary-icon pm-icon-blue">▦</span><div><small>Total products</small><strong>{loading ? "—" : summary.total}</strong><span>In your catalogue</span></div></article>
        <article className="pm-summary-card"><span className="pm-summary-icon pm-icon-amber">⚑</span><div><small>Low stock</small><strong>{loading ? "—" : summary.low}</strong><span>1–10 units remaining</span></div></article>
        <article className="pm-summary-card"><span className="pm-summary-icon pm-icon-red">!</span><div><small>Out of stock</small><strong>{loading ? "—" : summary.out}</strong><span>Needs replenishment</span></div></article>
        <article className="pm-summary-card"><span className="pm-summary-icon pm-icon-green">₹</span><div><small>Stock value</small><strong>{loading ? "—" : money(summary.value)}</strong><span>Price × quantity</span></div></article>
      </section>

      <section className="pm-panel pm-form-panel">
        <div className="pm-panel-heading"><div><span className="pm-eyebrow">{editingId === null ? "NEW CATALOGUE ITEM" : "EDITING PRODUCT #" + editingId}</span><h2>{editingId === null ? "Add a product" : "Update product details"}</h2><p>Fields marked * are required.</p></div>{editingId !== null && <button type="button" className="pm-button pm-button-outline" onClick={resetForm}>Cancel edit</button>}</div>
        <form className="pm-form" onSubmit={handleSubmit}>
          <label>Product name *<input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} placeholder="e.g. Wireless keyboard" /></label>
          <label>Description<input name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} placeholder="Short product description" /></label>
          <label>Category<input name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} maxLength={80} placeholder="e.g. Electronics" list="pm-category-options" /><datalist id="pm-category-options">{categories.map((category) => <option key={category} value={category} />)}</datalist></label>
          <label>Price (₹) *<input name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="0.00" /></label>
          <label>Quantity *<input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required placeholder="0" /></label>
          <div className="pm-form-actions"><button type="submit" className="pm-button pm-button-primary" disabled={saving}>{saving ? "Saving..." : editingId === null ? "+ Add product" : "Save changes"}</button>{editingId !== null && <button type="button" className="pm-button pm-button-outline" onClick={resetForm} disabled={saving}>Discard</button>}</div>
        </form>
      </section>

      {error && <div className="pm-alert pm-alert-error" role="alert">{error}</div>}
      {success && <div className="pm-alert pm-alert-success" role="status">{success}</div>}

      <section className="pm-panel pm-list-panel">
        <div className="pm-list-heading"><div><span className="pm-eyebrow">PRODUCT INVENTORY</span><h2>All products <span className="pm-count">{filteredProducts.length}</span></h2><p>Search, filter and manage catalogue items.</p></div></div>
        <div className="pm-toolbar">
          <label className="pm-search"><span>⌕</span><input aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID or description..." /></label>
          <select aria-label="Filter by category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
          <select aria-label="Filter by stock status" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}><option value="all">All stock</option><option value="available">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
          <select aria-label="Sort products" value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="newest">Newest first</option><option value="name">Name A–Z</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="stock-low">Stock: low to high</option></select>
        </div>

        {loading ? <div className="pm-empty"><span className="pm-loader" />Loading products...</div>
          : products.length === 0 ? <div className="pm-empty"><strong>Your catalogue is empty</strong><span>Add your first product using the form above.</span></div>
          : filteredProducts.length === 0 ? <div className="pm-empty"><strong>No matching products</strong><span>Try changing your search or filters.</span><button className="pm-button pm-button-outline" onClick={() => { setSearch(""); setCategoryFilter("all"); setStockFilter("all"); }}>Clear filters</button></div>
          : <div className="pm-table-wrap"><table className="pm-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>QUANTITY</th><th>STOCK STATUS</th><th className="pm-actions-heading">ACTIONS</th></tr></thead><tbody>
            {filteredProducts.map((product) => {
              const stock = stockState(product.quantity);
              return <tr key={product.id}>
                <td><div className="pm-product-cell"><span className="pm-product-avatar">{String(product.name || "P").trim().charAt(0).toUpperCase()}</span><div><strong>{product.name || "Unnamed product"}</strong><small>Product #{product.id}</small>{product.description && <small className="pm-description">{product.description}</small>}</div></div></td>
                <td><span className="pm-category">{categoryName(product.category) || "Uncategorized"}</span></td>
                <td className="pm-price">{money(product.price)}</td>
                <td className="pm-quantity">{product.quantity ?? 0}</td>
                <td><span className={"pm-stock " + stock.className}><i />{stock.label}</span></td>
                <td><div className="pm-row-actions"><button type="button" className="pm-action-edit" onClick={() => startEdit(product)}>Edit</button><button type="button" className="pm-action-delete" onClick={() => deleteProduct(product)}>Delete</button></div></td>
              </tr>;
            })}
          </tbody></table></div>}
        <div className="pm-table-footer">Showing {filteredProducts.length} of {products.length} products <span>Data loaded from Product Service via API Gateway</span></div>
      </section>
      <p className="pm-footnote">Stock status is calculated from the product quantity field. Inventory service stock records remain managed separately in the Inventory page.</p>
    </main>
  );
}
