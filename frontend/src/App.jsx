import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import apiClient from "./api/apiClient";
import Navbar from "./components/Navbar";
import Notifications from "./pages/Notifications";
import ArchitectureDashboard from "./pages/ArchitectureDashboard";

const EMPTY_FORM = { name: "", description: "", price: "", quantity: "", categoryId: "" };

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
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
      setError(err.response ? `Unable to load products (HTTP ${err.response.status}).` : "Unable to reach the API Gateway.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    apiClient.get("/api/categories")
      .then((response) => setCategories(Array.isArray(response.data) ? response.data : []))
      .catch(() => setCategories([]));
  }, [loadProducts]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

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
      categoryId: product.category?.id ? String(product.category.id) : "",
    });
    setSuccess("");
    setError("");
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
      category: form.categoryId ? { id: Number(form.categoryId) } : null,
    };
    try {
      if (editingId === null) {
        await apiClient.post("/api/products", payload);
        setSuccess("Product created successfully.");
      } else {
        await apiClient.put(`/api/products/${editingId}`, payload);
        setSuccess("Product updated successfully.");
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message ||
        (err.response ? `Save failed (HTTP ${err.response.status}).` : "Unable to reach the API Gateway."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}" (ID: ${product.id})?`)) return;
    setError("");
    setSuccess("");
    try {
      await apiClient.delete(`/api/products/${product.id}`);
      setSuccess("Product deleted successfully.");
      if (editingId === product.id) resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message ||
        (err.response ? `Delete failed (HTTP ${err.response.status}).` : "Unable to reach the API Gateway."));
    }
  }

  return (
    <main className="container">
      <div className="products-heading">
        <div><h2>Product Management</h2><p>Create, view, update and delete inventory products.</p></div>
        <button type="button" className="secondary-button" onClick={loadProducts}>↻ Refresh</button>
      </div>

      <section className="product-form-card">
        <div className="form-heading">
          <h3>{editingId === null ? "Add New Product" : `Edit Product #${editingId}`}</h3>
          {editingId !== null && <button type="button" className="text-button" onClick={resetForm}>Cancel edit</button>}
        </div>
        <form className="product-form" onSubmit={handleSubmit}>
          <label>Product name *
            <input name="name" value={form.name} onChange={handleChange} required maxLength={120} placeholder="e.g. Laptop" />
          </label>
          <label>Description
            <input name="description" value={form.description} onChange={handleChange} maxLength={500} placeholder="Product description" />
          </label>
          <div className="form-row">
            <label>Price (₹) *
              <input name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={handleChange} required />
            </label>
            <label>Quantity *
              <input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={handleChange} required />
            </label>
          </div>
          <label>Category
            <select name="categoryId" value={form.categoryId} onChange={handleChange}>
              <option value="">No category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            {categories.length === 0 && <small>Category list unavailable or no categories created yet.</small>}
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : editingId === null ? "Add Product" : "Save Changes"}
            </button>
            {editingId !== null && <button type="button" className="secondary-button" onClick={resetForm} disabled={saving}>Cancel</button>}
          </div>
        </form>
      </section>

      {error && <p className="crud-message error" role="alert">{error}</p>}
      {success && <p className="crud-message success" role="status">{success}</p>}
      <div className="list-heading"><h3>Products</h3><span>{products.length} total</span></div>
      {loading && <p>Loading products...</p>}
      {!loading && !error && products.length === 0 && <p>No products found. Add your first product above.</p>}
      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-card-title"><h3>{product.name}</h3><span className="product-id">#{product.id}</span></div>
            <p className="product-description">{product.description || "No description"}</p>
            <p><strong>Price:</strong> ₹{Number(product.price).toLocaleString("en-IN")}</p>
            <p><strong>Quantity:</strong> {product.quantity ?? 0}</p>
            <p><strong>Category:</strong> {typeof product.category === "object" ? (product.category?.name ?? "Not assigned") : (product.category ?? "Not assigned")}</p>
            <div className="product-actions">
              <button type="button" className="edit-button" onClick={() => startEdit(product)}>Edit</button>
              <button type="button" className="delete-button" onClick={() => deleteProduct(product)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function Home() {
  return <><header className="header"><h1>Inventory Management System</h1><p>Manage your products in one place</p></header><Products /></>;
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/architecture" element={<ArchitectureDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<main className="container"><h2>Page not found</h2><Link to="/">Back to Products</Link></main>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
