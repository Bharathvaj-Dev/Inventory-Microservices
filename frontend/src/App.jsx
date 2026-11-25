import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Notifications from "./pages/Notifications";
import ArchitectureDashboard from "./pages/ArchitectureDashboard";
import { DashboardPage, InventoryPage, PurchasesPage, SalesPage } from "./OperationsPages";
import ProductManagement from "./ProductManagement";
import Reports from "./Reports";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/architecture" element={<ArchitectureDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<main className="container"><h2>Page not found</h2><Link to="/">Back to Dashboard</Link></main>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
