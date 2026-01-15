import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminHome from "./pages/AdminHome";
import AdminProducts from "./pages/AdminProducts";
import AdminCategoryOrder from "./pages/AdminCategoryOrder";
import AdminShipping from "./pages/AdminShipping";
import Vitrine from "./pages/Vitrine";
import VitrineCategory from "./pages/VitrineCategory";
import { RequireAuth } from "./components/RequireAuth";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Navigate to="/catalogo" replace />} />
          <Route path="/catalogo" element={<Index />} />
          <Route path="/catalogo/:category" element={<CategoryPage />} />
          <Route path="/catalogo/:category/:subcategory" element={<CategoryPage />} />
          <Route path="/produto/:id" element={<ProductPage />} />
          
          {/* Vitrine Routes - Without Prices */}
          <Route path="/vitrine" element={<Vitrine />} />
          <Route path="/vitrine/:category" element={<VitrineCategory />} />
          <Route path="/vitrine/:category/:subcategory" element={<VitrineCategory />} />
          
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAuth><AdminHome /></RequireAuth>} />
          <Route path="/admin/home" element={<RequireAuth><AdminHome /></RequireAuth>} />
          <Route path="/admin/products" element={<RequireAuth><AdminProducts /></RequireAuth>} />
          <Route path="/admin/categories" element={<RequireAuth><AdminCategoryOrder /></RequireAuth>} />
          <Route path="/admin/shipping" element={<RequireAuth><AdminShipping /></RequireAuth>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
