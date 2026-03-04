import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SiteLayout from "./components/layout/SiteLayout.jsx";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import ImageSearch from "./pages/ImageSearch.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Discounts from "./pages/Discounts.jsx";
import DiscountCategory from "./pages/DiscountCategory.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import OAuthCallback from "./pages/auth/OAuthCallback.jsx";
import CartPage from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import PaymentProcess from "./pages/PaymentProcess.jsx";
import Orders from "./pages/Orders.jsx";
import ContactPage from "./pages/Contact.jsx";
import SupportPage from "./pages/Support.jsx";
import TrackOrderPage from "./pages/TrackOrder.jsx";
import PrivacyPage from "./pages/Privacy.jsx";
import FAQPage from "./pages/FAQ.jsx";
import TermsPage from "./pages/Terms.jsx";
import CookiesPage from "./pages/Cookies.jsx";
import NotificationsPage from "./pages/Notifications.jsx";
import BrandDetail from "./pages/BrandDetail.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import CustomerProfile from "./pages/CustomerProfile.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminProducts from "./pages/admin/Products.jsx";
import AdminCategories from "./pages/admin/Categories.jsx";
import AdminBrands from "./pages/admin/Brands.jsx";
import AdminOrders from "./pages/admin/Orders.jsx";
import AdminInvoicePage from "./pages/admin/Invoice.jsx";
import AdminCustomers from "./pages/admin/Customers.jsx";
import AdminAdministrators from "./pages/admin/Administrators.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";
import HomePageManager from "./pages/admin/HomePageManager.jsx";
import CompleteHomepageManager from "./pages/admin/CompleteHomepageManager.jsx";
import { HomepageSettingsProvider, useHomepageSettings } from "./state/homepageSettings.jsx";
import { useLanguage } from "./lib/i18n.jsx";
import Reports from "./pages/admin/Reports.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Settings from "./pages/admin/Settings.jsx";
import Contacts from "./pages/admin/Contacts.jsx";
import Messages from "./pages/admin/Messages.jsx";
import ChatbotSettings from "./pages/admin/ChatbotSettings.jsx";
import Notifications from "./pages/admin/Notifications.jsx";
import Profile from "./pages/admin/Profile.jsx";
import AdminSales from "./pages/admin/Sales.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import AdminManagement from "./pages/admin/AdminManagement.jsx";
import AdminPayments from "./pages/admin/Payments.jsx";
import HomepageSettingsTest from "./pages/HomepageSettingsTest.jsx";
import PublicHomepageManager from "./pages/PublicHomepageManager.jsx";
import ExtendedHomepageManager from "./pages/ExtendedHomepageManager.jsx";
import AdminShipments from "./pages/admin/Shipments.jsx";
import AdminDrivers from "./pages/admin/Drivers.jsx";
import AdminReplacementCases from "./pages/admin/ReplacementCases.jsx";
import PaymentSettings from "./pages/admin/PaymentSettings.jsx";
import DriverScanPage from "./pages/driver/Scan.jsx";
import { useAuth } from "./state/auth.jsx";
import { AdminContentSkeleton } from "./components/admin/AdminLoading.jsx";

function RequireAuth({ children }) {
  const { user, booted } = useAuth();
  if (!booted) return (
    <div className="p-6">
      <AdminContentSkeleton lines={2} imageHeight={120} className="max-w-3xl mx-auto" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function isAdminUser(user) {
  if (!user) return false;
  // Check role field (admin|superadmin|customer)
  const role = user?.role;
  if (role && (String(role).toLowerCase() === "admin" || String(role).toLowerCase() === "superadmin")) return true;
  // Also check is_admin boolean field for backward compatibility
  const isAdmin = user?.is_admin;
  if (isAdmin === true || isAdmin === 1 || isAdmin === "1") return true;
  return false;
}

function RequireAdmin({ children }) {
  const { user, booted } = useAuth();
  if (!booted) return (
    <div className="p-6">
      <AdminContentSkeleton lines={2} imageHeight={140} className="max-w-4xl mx-auto" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  if (!isAdminUser(user)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <HomepageSettingsProvider>
      <FontSettingsSync />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/image-search" element={<ImageSearch />} />
          <Route path="/brands/:slug" element={<BrandDetail />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/discounts" element={<Discounts />} />
          <Route path="/discounts/:categorySlug" element={<DiscountCategory />} />
          <Route path="/p/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/homepage-settings-test" element={<HomepageSettingsTest />} />
          <Route path="/homepage-manager" element={<PublicHomepageManager />} />
          <Route path="/homepage-manager-extended" element={<ExtendedHomepageManager />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/driver/scan" element={<DriverScanPage />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <CustomerProfile />
              </RequireAuth>
            }
          />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="/payment/:orderId"
            element={
              <RequireAuth>
                <PaymentProcess />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/oauth/callback/:ticket" element={<OAuthCallback />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="reports" element={<Reports />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="homepage" element={<HomePageManager />} />
          <Route path="homepage-complete" element={<CompleteHomepageManager />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderId/invoice" element={<AdminInvoicePage />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="administrators" element={<AdminAdministrators />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="chatbot" element={<ChatbotSettings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="admin-management" element={<AdminManagement />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="shipments" element={<AdminShipments />} />
          <Route path="replacement-cases" element={<AdminReplacementCases />} />
          <Route path="payment-settings" element={<PaymentSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HomepageSettingsProvider>
  );
}

function FontSettingsSync() {
  const { settings } = useHomepageSettings();
  const { language } = useLanguage();

  React.useEffect(() => {
    const root = document.documentElement;
    const fontEn = settings?.fonts?.english || "Inter";
    const fontKm = settings?.fonts?.khmer || "Noto Sans Khmer";

    const baseFallback = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"";
    const kmFallback = "\"Noto Sans Khmer\", \"Kantumruy Pro\", \"Battambang\", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"";

    const normalizeStack = (font, fallback) => {
      if (!font || String(font).toLowerCase() === "system") {
        return fallback;
      }
      if (String(font).includes(",")) {
        return font;
      }
      return `"${font}", ${fallback}`;
    };

    const enStack = normalizeStack(fontEn, baseFallback);
    const kmStack = normalizeStack(fontKm, kmFallback);

    root.style.setProperty("--fs-font-en", enStack);
    root.style.setProperty("--fs-font-km", kmStack);
    root.style.setProperty("--fs-font-base", language === "km" ? kmStack : enStack);
    root.setAttribute("data-lang", language || "en");
  }, [settings, language]);

  return null;
}



