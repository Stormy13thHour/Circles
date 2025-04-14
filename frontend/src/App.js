import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import Search from "./pages/Search";
import NotificationsPage from "./pages/NotificationsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/userprofile/:username" element={<UserProfile />} />
        <Route path="/:username" element={<Dashboard />} />
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        <Route path="/user/notifications" element={<NotificationsPage />} />
      </Routes>
    </Router>
  );
}

export default App;

