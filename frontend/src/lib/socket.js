import io from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  if (!socket) {
    socket = io(process.env.REACT_APP_BACKEND_URL || 'http://192.168.1.111:3005', {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }     
  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};