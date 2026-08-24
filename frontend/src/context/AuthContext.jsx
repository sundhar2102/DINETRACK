import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('smarttable_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smarttable_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAndRestoreSession = async () => {
      const savedToken = localStorage.getItem('smarttable_token');
      if (savedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          localStorage.setItem('smarttable_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAndRestoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const userData = res.data.user;
    const tokenData = res.data.token;
    
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('smarttable_token', tokenData);
    localStorage.setItem('smarttable_user', JSON.stringify(userData));
    return res.data;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const userResult = res.data.user;
    const tokenResult = res.data.token;

    setUser(userResult);
    setToken(tokenResult);
    localStorage.setItem('smarttable_token', tokenResult);
    localStorage.setItem('smarttable_user', JSON.stringify(userResult));
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smarttable_token');
    localStorage.removeItem('smarttable_user');
  };

  // Quick switch role helper for demonstration / testing
  const switchDemoUser = async (roleType) => {
    let email = 'alex@smarttable.com';
    const roleKey = roleType?.toUpperCase();
    if (roleKey === 'ADMIN') email = 'admin@smarttable.com';
    else if (roleKey === 'OWNER' || roleKey === 'OWNER_SANGEETHA') email = 'owner@sangeetha.com';
    else if (roleKey === 'OWNER_BBQNATION') email = 'owner@bbqnation.com';
    else if (roleKey === 'OWNER_TOSCANO') email = 'owner@toscano.com';
    else if (roleKey === 'OWNER_CHINA') email = 'owner@mainlandchina.com';
    else if (roleKey === 'OWNER_COASTAL') email = 'owner@coastalcatch.com';
    else if (roleKey === 'OWNER_PARADISE') email = 'owner@paradise.com';
    else if (roleKey === 'KITCHEN') email = 'chef@sangeetha.com';
    else if (roleKey === 'WAITER') email = 'waiter@sangeetha.com';
    else if (roleKey === 'CUSTOMER_2') email = 'priya@smarttable.com';


    try {
      const res = await authApi.login({ email, password: 'Password123!' });
      const userData = res.data.user;
      const tokenData = res.data.token;

      setUser(userData);
      setToken(tokenData);
      localStorage.setItem('smarttable_token', tokenData);
      localStorage.setItem('smarttable_user', JSON.stringify(userData));
      return userData;
    } catch (e) {
      console.error('Switch user failed:', e);
      return null;
    }
  };


  const userRole = user?.role?.toUpperCase() || null;
  const isOwner = userRole === 'OWNER';
  const isStaff = userRole === 'STAFF';
  const isCustomer = userRole === 'CUSTOMER';
  const isAdmin = userRole === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoUser,
        isAuthenticated: !!user && !!token,
        role: userRole,
        isOwner,
        isStaff,
        isCustomer,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
