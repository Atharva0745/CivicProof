import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    // In dev, connects to proxy or window.location.origin
    socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to CivicProof live gateway:', socket.id);
      socket.emit('join:public');
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from live gateway');
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const joinIncidentRoom = (incidentId) => {
  const s = getSocket();
  if (s && incidentId) {
    s.emit('join:incident', incidentId);
  }
};

export const leaveIncidentRoom = (incidentId) => {
  const s = getSocket();
  if (s && incidentId) {
    s.emit('leave:incident', incidentId);
  }
};
