let io = null;

const initSocket = (ioInstance) => {
  io = ioInstance;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join public incident feed
    socket.on('join:public', () => {
      socket.join('public-incidents');
    });

    // Join specific incident room for live updates
    socket.on('join:incident', (incidentId) => {
      if (incidentId) {
        socket.join(`incident:${incidentId}`);
      }
    });

    // Leave specific incident room
    socket.on('leave:incident', (incidentId) => {
      if (incidentId) {
        socket.leave(`incident:${incidentId}`);
      }
    });

    // Join moderator / admin room (client sends auth token or triggers upon role verification)
    socket.on('join:moderators', () => {
      socket.join('moderators-channel');
    });

    socket.on('disconnect', () => {
      // Disconnect handled cleanly
    });
  });
};

const getIO = () => io;

/**
 * Broadcast incident updates to rooms with appropriate field redaction
 */
const emitIncidentEvent = (event, data, incidentId = null) => {
  if (!io) return;

  // Clone data to avoid accidental mutation
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data: sanitizePayload(data)
  };

  // Broadcast to global public room
  io.to('public-incidents').emit(event, payload);

  // Broadcast to specific incident room if provided
  if (incidentId) {
    io.to(`incident:${incidentId}`).emit(event, payload);
  }

  // Broadcast full payload to moderators
  io.to('moderators-channel').emit(event, {
    event,
    timestamp: new Date().toISOString(),
    data
  });
};

/**
 * Remove private/sensitive fields for public broadcast
 */
const sanitizePayload = (item) => {
  if (!item || typeof item !== 'object') return item;
  const sanitized = JSON.parse(JSON.stringify(item));
  
  if (sanitized.officialReference) {
    delete sanitized.officialReference;
  }
  if (sanitized.officialComplaint && sanitized.officialComplaint.officialReference) {
    delete sanitized.officialComplaint.officialReference;
  }
  return sanitized;
};

module.exports = {
  initSocket,
  getIO,
  emitIncidentEvent
};
