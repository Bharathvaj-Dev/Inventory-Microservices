import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import apiClient from "./api/apiClient";
import Navbar from "./components/Navbar";
import Notifications from "./pages/Notifications";

function Products() {
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
apiClient
.get("/api/products")
.then((response) => {
setProducts(response.data);
})
.catch((err) => {
setError(
err.response
? `HTTP Error: ${err.response.status}`
: err.message
);
})
.finally(() => setLoading(false));
}, []);

return ( <main className="container"> <h2>Products</h2>

  {loading && <p>Loading products...</p>}
  {error && <p className="error">Error: {error}</p>}

  {!loading && !error && products.length === 0 && (
    <p>No products found.</p>
  )}

  <div className="product-grid">
    {products.map((product) => (
      <div className="product-card" key={product.id}>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <p>
          <strong>Price:</strong>{" "}
          ₹{Number(product.price).toLocaleString("en-IN")}
        </p>
        <p>
          <strong>Quantity:</strong> {product.quantity}
        </p>
        <p>
          <strong>Category:</strong>{" "}
          {product.category ?? "Not assigned"}
        </p>
      </div>
    ))}
  </div>
</main>

);
}

function Home() {
return (
<> <header className="header"> <h1>Inventory Management System</h1> <p>Manage your products in one place</p> </header> <Products />
</>
);
}

function App() {
return ( <BrowserRouter> <div className="app"> <Navbar />

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route
        path="*"
        element={
          <main className="container">
            <h2>Page not found</h2>
            <Link to="/">Back to Products</Link>
          </main>
        }
      />
    </Routes>
  </div>
</BrowserRouter>

);
}

export default App;
