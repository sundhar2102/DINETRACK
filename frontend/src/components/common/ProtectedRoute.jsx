import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [], requireGuest = false }) {
  const { user, isAuthenticated, loading, isOwner, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If page requires user to NOT be logged in (e.g. /login, /register)
  if (requireGuest) {
    if (isAuthenticated) {
      if (isOwner || isStaff) {
        return <Navigate to="/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
    return children;
  }

  // If user is not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required (e.g. OWNER / STAFF for /dashboard)
  if (allowedRoles.length > 0) {
    const userRole = user?.role?.toUpperCase();
    const hasAllowedRole = allowedRoles.map(r => r.toUpperCase()).includes(userRole);

    if (!hasAllowedRole) {
      // If Customer attempts to open Owner Dashboard, redirect to customer home
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
