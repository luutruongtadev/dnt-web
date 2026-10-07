import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Guards child routes by requiring a valid auth token in localStorage.
 * If absent, redirects to `/login` and preserves the attempted location.
 */
const ProtectedRoute = ({ redirectPath = '/login' }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const location = useLocation();

  if (!token) {
    return <Navigate to={`${redirectPath}${location.search}`} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;