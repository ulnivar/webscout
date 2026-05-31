import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';

// Auth
import AuthUnified from './pages/auth/AuthUnified';
import ForgotPassword from './pages/auth/ForgotPassword';

// User
import Dashboard from './pages/user/Dashboard';
import BotSettings from './pages/user/BotSettings';
import Subscriptions from './pages/user/Subscriptions';
import Notifications from './pages/user/Notifications';
import Profile from './pages/user/Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><AuthUnified /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><AuthUnified /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/bot-settings" element={<ProtectedRoute><BotSettings /></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
