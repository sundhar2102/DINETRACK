import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { FavoritesProvider } from './context/FavoritesContext';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import MobileNav from './components/common/MobileNav';
import CartDrawer from './components/order/CartDrawer';
import NotificationToast from './components/common/NotificationToast';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import RestaurantSearch from './pages/RestaurantSearch';
import RestaurantDetail from './pages/RestaurantDetail';
import ReserveTable from './pages/ReserveTable';
import LiveTracking from './pages/LiveTracking';
import WaitlistPage from './pages/WaitlistPage';
import ReservationHistory from './pages/ReservationHistory';
import OrderHistory from './pages/OrderHistory';
import Favorites from './pages/Favorites';
import Offers from './pages/Offers';
import Events from './pages/Events';
import Banquets from './pages/Banquets';
import Membership from './pages/Membership';
import Blog from './pages/Blog';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import RestaurantLogin from './pages/owner/RestaurantLogin';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';


export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <LocationProvider>
            <CartProvider>
              <NotificationProvider>
                <FavoritesProvider>
                  <div className="min-h-screen flex flex-col bg-[#0B0F19] text-gray-100 selection:bg-orange-500 selection:text-white">
                    
                    {/* Sticky Global Navbar */}
                    <Navbar />

                    {/* Real-time In-App Notification Popups */}
                    <NotificationToast />

                    {/* Pre-Order Basket Slide-Over */}
                    <CartDrawer />

                    {/* Main Route Body */}
                    <main className="flex-1">
                      <Routes>
                        {/* Public Customer Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/restaurants" element={<RestaurantSearch />} />
                        <Route path="/search" element={<RestaurantSearch />} />
                        
                        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                        
                        <Route path="/restaurant/:id/reserve" element={<ReserveTable />} />
                        <Route path="/restaurants/:id/reserve" element={<ReserveTable />} />
                        
                        <Route path="/restaurant/:id/waitlist" element={<WaitlistPage />} />
                        <Route path="/restaurants/:id/waitlist" element={<WaitlistPage />} />
                        
                        <Route path="/tracking/:id" element={<LiveTracking />} />
                        
                        {/* New Discovery & Informational Pages */}
                        <Route path="/offers" element={<Offers />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/banquets" element={<Banquets />} />
                        <Route path="/membership" element={<Membership />} />
                        <Route path="/blog" element={<Blog />} />

                        {/* Customer Authenticated Protected Routes */}
                        <Route 
                          path="/reservations" 
                          element={
                            <ProtectedRoute>
                              <ReservationHistory />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/bookings" 
                          element={
                            <ProtectedRoute>
                              <ReservationHistory />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/favorites" 
                          element={
                            <ProtectedRoute>
                              <Favorites />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/orders" 
                          element={
                            <ProtectedRoute>
                              <OrderHistory />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/profile" 
                          element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          } 
                        />

                        {/* Dedicated Restaurant Partner Login */}
                        <Route 
                          path="/restaurant/login" 
                          element={<RestaurantLogin />} 
                        />

                        {/* Guest Auth Routes */}
                        <Route 
                          path="/login" 
                          element={
                            <ProtectedRoute requireGuest>
                              <Login />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/register" 
                          element={
                            <ProtectedRoute requireGuest>
                              <Register />
                            </ProtectedRoute>
                          } 
                        />

                        {/* Owner & Staff Only Dashboard Routes */}
                        <Route 
                          path="/restaurant/dashboard" 
                          element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STAFF', 'ADMIN']}>
                              <OwnerDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/restaurant/tables" 
                          element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STAFF', 'ADMIN']}>
                              <OwnerDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/restaurant/menu" 
                          element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STAFF', 'ADMIN']}>
                              <OwnerDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/restaurant/offers" 
                          element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STAFF', 'ADMIN']}>
                              <OwnerDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/restaurant/profile" 
                          element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STAFF', 'ADMIN']}>
                              <OwnerDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/dashboard" 
                          element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STAFF', 'ADMIN']}>
                              <OwnerDashboard />
                            </ProtectedRoute>
                          } 
                        />

                        {/* App Admin Super Console Routes */}
                        <Route 
                          path="/admin" 
                          element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                              <AdminDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/dashboard" 
                          element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                              <AdminDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/restaurants" 
                          element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                              <AdminDashboard />
                            </ProtectedRoute>
                          } 
                        />

                        {/* Catch-all Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />

                      </Routes>
                    </main>

                    {/* Footer */}
                    <Footer />

                    {/* Mobile App Bottom Navigation Bar */}
                    <MobileNav />

                  </div>
                </FavoritesProvider>
              </NotificationProvider>
            </CartProvider>
          </LocationProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}
