import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Audio sound disabled as per user request
const playNotificationSound = () => {};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const host = (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
      ? window.location.hostname
      : '10.248.32.127';
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
      (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:5000'
        : `http://${host}:5000`
    );
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.IO Connected to Server:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join_discovery');
      if (user?.id) {
        newSocket.emit('join_user', user.id);
      }
      if (user?.restaurant?.id) {
        newSocket.emit('join_restaurant', user.restaurant.id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket.IO Disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Update room subscriptions when user state changes
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join_user', user.id);
      if (user.restaurant?.id) {
        socket.emit('join_restaurant', user.restaurant.id);
      }
    }
  }, [socket, isConnected, user]);

  const joinRestaurantRoom = (restaurantId) => {
    if (socket && isConnected && restaurantId) {
      socket.emit('join_restaurant', restaurantId);
    }
  };

  const leaveRestaurantRoom = (restaurantId) => {
    if (socket && isConnected && restaurantId) {
      socket.emit('leave_restaurant', restaurantId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinRestaurantRoom,
        leaveRestaurantRoom,
        playNotificationSound
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
