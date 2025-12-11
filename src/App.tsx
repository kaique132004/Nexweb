import type { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Asset from "./pages/Dashboard/Asset";
import UserList from "./pages/List/UserList";
import RegionList from "./pages/List/RegionList";
import SupplyList from "./pages/List/SupplyList";
import TransactionList from "./pages/List/TransactionList";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import RedefinePassword from "./pages/AuthPages/RedefinePass";
import FirstLoginPage from "./pages/AuthPages/FirstLoginPage";
import { NotificationProvider } from "./context/NotificationContext";

// Componente de proteção
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuth = sessionStorage.getItem("user-session");
  return isAuth ? children : <Navigate to="/signin" replace />;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
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
          {/* Others Page */}
          <Route path="/profile" element={<UserProfiles />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/blank" element={<Blank />} />
          <Route path="/asset" element={<Asset />} />
          {/* Forms */}
          <Route path="/form-elements" element={<FormElements />} />
          {/* Tables */}
          <Route path="/basic-tables" element={<BasicTables />} />
          {/* Ui Elements */}
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/badge" element={<Badges />} />
          <Route path="/buttons" element={<Buttons />} />
          <Route path="/images" element={<Images />} />
          <Route path="/videos" element={<Videos />} />
          {/* Charts */}
          <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} />
          {/* Lists */}
          <Route path="/user-list" element={<UserList />} />
          <Route path="/region-list" element={<RegionList />} />
          <Route path="/supply-list" element={<SupplyList />} />
          <Route path="/transaction-list" element={<TransactionList />} />
        </Route>
        {/* Auth Layout */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/redefine-password" element={<RedefinePassword />} />
        <Route path="/first-login" element={<FirstLoginPage />} />
        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router >
  );
}
