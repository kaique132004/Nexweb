import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./shared/components/common/ScrollToTop";
import { NotificationProvider } from "./context/NotificationContext";
import { ErrorBoundary } from "./shared/components/common/ErrorBoundary";

const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));
const Blank = lazy(() => import("./pages/Blank"));
const AppLayout = lazy(() => import("./layout/AppLayout"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const Asset = lazy(() => import("./pages/Asset/AssetList"));
const UserList = lazy(() => import("./pages/Users/UserList"));
const RegionList = lazy(() => import("./pages/Region/RegionList"));
const SupplyList = lazy(() => import("./pages/Supply/SupplyList"));
const TransactionList = lazy(() => import("./pages/Transactions/TransactionList"));
const ForgotPassword = lazy(() => import("./pages/AuthPages/ForgotPassword"));
const RedefinePassword = lazy(() => import("./pages/AuthPages/RedefinePass"));
const FirstLoginPage = lazy(() => import("./pages/AuthPages/FirstLoginPage"));
const GenQR = lazy(() => import("./pages/QRcode/GenQR"));
const ConsumptionPage = lazy(() => import("./pages/Consumptions/ConsumptionPage"));
const TwoFactorAuthPage = lazy(() => import("./pages/AuthPages/TwoFactorAuthPage"));
const SystemStatusPage  = lazy(() => import("./pages/Admin/SystemStatusPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Componente de proteção
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuth = sessionStorage.getItem("user-session");
  return isAuth ? children : <Navigate to="/signin" replace />;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Dashboard Layout protegido */}
          <Route
            element={
              <ProtectedRoute>
                <NotificationProvider>
                  <AppLayout />
                </NotificationProvider>
              </ProtectedRoute>
            }
          >
            <Route index path="/" element={<Home />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/asset" element={<Asset />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
            <Route path="/user-list" element={<UserList />} />
            <Route path="/region-list" element={<RegionList />} />
            <Route path="/supply-list" element={<SupplyList />} />
            <Route path="/transaction-list" element={<TransactionList />} />
            <Route path="/qrcode" element={<GenQR />} />
            <Route path="/register-consumption" element={<ConsumptionPage />} />
            <Route path="/admin/system" element={<SystemStatusPage />} />
          </Route>
          {/* Auth Layout */}
          <Route path="/2fa" element={<TwoFactorAuthPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/redefine-password" element={<RedefinePassword />} />
          <Route path="/first-login" element={<FirstLoginPage />} />
          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </Router>
  );
}
