const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Enhanced logging utility
const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, error ? error.stack || error : '');
  },
  debug: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Create HTTP server
const server = http.createServer();

// Create WebSocket server with browser-compatible configuration
const wss = new WebSocket.Server({
  server,
  // Remove ping/pong settings that might conflict with browser WebSocket
  // The browser WebSocket API handles ping/pong automatically
  maxPayload: 1024 * 1024 // 1MB
});

// Load actual venue data
let venueData = null;
let seatStates = new Map();
let currentVenueFile = 'venue.json'; // Default to small venue

// Function to load venue data
function loadVenueData(venueFile) {
  try {
    const venuePath = path.join(__dirname, 'public', venueFile);
    const venueFileContent = fs.readFileSync(venuePath, 'utf8');
    const newVenueData = JSON.parse(venueFileContent);

    // Clear existing seat states
    seatStates.clear();

    // Initialize seat states from new venue data
    newVenueData.sections.forEach(section => {
      section.rows.forEach(row => {
        row.seats.forEach(seat => {
          seatStates.set(seat.id, seat.status || "available");
        });
      });
    });

    venueData = newVenueData;
    currentVenueFile = venueFile;

    logger.info(`Loaded venue: ${venueData.name} with ${seatStates.size} seats from ${venueFile}`);
    return true;
  } catch (error) {
    logger.error(`Failed to load venue data from ${venueFile}:`, error);
    return false;
  }
}

// Load default venue
if (!loadVenueData(currentVenueFile)) {
  logger.error('Failed to load default venue data');
  process.exit(1);
}

// Store connected clients by clientId (keep only the latest connection per client)
const clientConnections = new Map(); // clientId -> ws
const clients = new Set(); // Keep for backward compatibility

// Track connection statistics
const connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  disconnections: 0,
  errors: 0
};

// Enhanced connection handling
wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  connectionStats.totalConnections++;
  connectionStats.activeConnections++;

  logger.info(`New client connected`, {
    connectionId,
    clientIP,
    userAgent: userAgent.substring(0, 100), // Truncate long user agents
    totalConnections: connectionStats.totalConnections,
    activeConnections: connectionStats.activeConnections
  });

  clients.add(ws);

  // Set up connection metadata
  ws.connectionId = connectionId;
  ws.clientIP = clientIP;
  ws.connectedAt = Date.now();
  ws.lastMessage = Date.now();
  ws.messageCount = 0;

  // Send welcome message with current seat states
  try {
    ws.send(JSON.stringify({
      type: 'heartbeat',
      data: 'connected',
      connectionId: connectionId
    }));
    logger.debug(`Sent welcome message to connection ${connectionId}`);
  } catch (error) {
    logger.error(`Failed to send welcome message to connection ${connectionId}:`, error);
  }

  // Handle incoming messages with enhanced error handling
  ws.on('message', (message) => {
    try {
      ws.messageCount++;
      ws.lastMessage = Date.now();
      const messageSize = message.length;

      logger.debug(`Received message from connection ${connectionId}`, {
        size: messageSize,
        messageCount: ws.messageCount
      });

      // Check message size
      if (messageSize > 1024 * 1024) { // 1MB limit
        logger.warn(`Large message received from connection ${connectionId}`, {
          size: messageSize,
          limit: 1024 * 1024
        });
      }

      const data = JSON.parse(message);

      if (data.type === 'heartbeat') {
        // Respond to heartbeat
        ws.send(JSON.stringify({
          type: 'heartbeat',
          data: null,
          timestamp: Date.now()
        }));

        logger.debug(`Responded to heartbeat from connection ${connectionId}`);
      } else if (data.type === 'switch_venue') {
        // Handle venue switching
        const { venueFile } = data.data;

        if (!venueFile) {
          logger.warn(`Invalid venue switch request from connection ${connectionId}`, {
            data: data.data
          });
          return;
        }

        if (loadVenueData(venueFile)) {
          // Broadcast venue change to all connected clients
          const venueChangeMessage = JSON.stringify({
            type: 'venue_changed',
            data: {
              venue: venueData,
              venueFile: currentVenueFile
            },
            timestamp: Date.now()
          });

          // Send to all connected clients
          clientConnections.forEach((clientWs, clientId) => {
            try {
              clientWs.send(venueChangeMessage);
              logger.debug(`Sent venue change to client ${clientId}`);
            } catch (error) {
              logger.error(`Failed to send venue change to client ${clientId}:`, error);
            }
          });

          logger.info(`Switched to venue: ${venueData.name} (${currentVenueFile})`);
        } else {
          // Send error back to requesting client
          ws.send(JSON.stringify({
            type: 'venue_switch_error',
            data: {
              error: `Failed to load venue: ${venueFile}`,
              currentVenue: currentVenueFile
            },
            timestamp: Date.now()
          }));
        }
      } else if (data.type === 'seat_selection') {
        // Handle seat selection from client
        const { seatId, isSelected, clientId } = data.data;

        if (!seatId) {
          logger.warn(`Invalid seat selection from connection ${connectionId}`, {
            data: data.data,
            clientId
          });
          return;
        }

        // Check if this is a new connection from the same client
        const existingConnection = clientConnections.get(clientId);
        if (existingConnection && existingConnection !== ws) {
          logger.info(`Closing old connection for client ${clientId}`, {
            oldConnectionId: existingConnection.connectionId,
            newConnectionId: connectionId
          });

          try {
            existingConnection.close(1000, 'New connection from same client');
          } catch (error) {
            logger.error(`Error closing old connection for client ${clientId}:`, error);
          }

          clients.delete(existingConnection);
          connectionStats.activeConnections--;
        }

        // Store this as the latest connection for this client
        clientConnections.set(clientId, ws);

        // Update the seat state
        const newStatus = isSelected ? "reserved" : "available";
        seatStates.set(seatId, newStatus);

        logger.info(`Seat ${seatId} ${isSelected ? 'selected' : 'deselected'} by client ${clientId}`, {
          connectionId,
          seatId,
          isSelected,
          clientId,
          newStatus
        });

        // Broadcast the selection to all other clients
        const update = {
          type: 'seat_update',
          data: {
            seatId: seatId,
            status: newStatus,
            timestamp: Date.now(),
            source: 'user_selection'
          }
        };

        let broadcastCount = 0;
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            try {
              client.send(JSON.stringify(update));
              broadcastCount++;
            } catch (error) {
              logger.error(`Failed to broadcast to client:`, error);
              // Remove the problematic client
              clients.delete(client);
              connectionStats.activeConnections--;
            }
          }
        });

        logger.debug(`Broadcasted seat update to ${broadcastCount} clients`, {
          seatId,
          newStatus,
          broadcastCount
        });
      } else {
        logger.warn(`Unknown message type from connection ${connectionId}`, {
          type: data.type,
          data: data.data
        });
      }
    } catch (error) {
      logger.error(`Error processing message from connection ${connectionId}:`, error);
      connectionStats.errors++;

      // Send error response to client
      try {
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            message: 'Invalid message format',
            timestamp: Date.now()
          }
        }));
      } catch (sendError) {
        logger.error(`Failed to send error response to connection ${connectionId}:`, sendError);
      }
    }
  });

  // Enhanced disconnect handling
  ws.on('close', (code, reason) => {
    const duration = Date.now() - ws.connectedAt;
    const reasonString = reason ? reason.toString() : 'No reason provided';

    connectionStats.disconnections++;
    connectionStats.activeConnections--;

    logger.info(`Client disconnected`, {
      connectionId: ws.connectionId,
      code,
      reason: reasonString,
      duration: `${Math.round(duration / 1000)}s`,
      messageCount: ws.messageCount,
      activeConnections: connectionStats.activeConnections
    });

    // Log disconnect reasons for debugging
    const disconnectReasons = {
      1000: 'Normal closure',
      1001: 'Going away (browser tab closed/navigation)',
      1002: 'Protocol error',
      1003: 'Unsupported data',
      1004: 'Reserved',
      1005: 'No status code',
      1006: 'Abnormal closure (no close frame)',
      1007: 'Invalid frame payload data',
      1008: 'Policy violation',
      1009: 'Message too big',
      1010: 'Extension negotiation failed',
      1011: 'Internal error',
      1015: 'TLS handshake failed'
    };

    if (disconnectReasons[code]) {
      logger.debug(`Disconnect reason: ${disconnectReasons[code]}`, {
        code,
        connectionId: ws.connectionId
      });
    }

    // Remove from clients set
    clients.delete(ws);

    // Remove from clientConnections map if this was the stored connection
    for (const [clientId, connection] of clientConnections.entries()) {
      if (connection === ws) {
        clientConnections.delete(clientId);
        logger.debug(`Removed client ${clientId} from connection tracking`, {
          connectionId: ws.connectionId
        });
        break;
      }
    }
  });

  // Enhanced error handling
  ws.on('error', (error) => {
    logger.error(`WebSocket error on connection ${ws.connectionId}:`, error);
    connectionStats.errors++;
    connectionStats.activeConnections--;

    clients.delete(ws);

    // Remove from clientConnections map
    for (const [clientId, connection] of clientConnections.entries()) {
      if (connection === ws) {
        clientConnections.delete(clientId);
        logger.debug(`Removed client ${clientId} from connection tracking due to error`);
        break;
      }
    }
  });
});

// Periodic connection health check (less aggressive)
setInterval(() => {
  const now = Date.now();
  const staleConnections = [];

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      const timeSinceLastMessage = now - ws.lastMessage;

      // If no message received for 5 minutes, consider connection stale
      if (timeSinceLastMessage > 300000) { // 5 minutes
        staleConnections.push(ws);
        logger.warn(`Stale connection detected`, {
          connectionId: ws.connectionId,
          timeSinceLastMessage: `${Math.round(timeSinceLastMessage / 1000)}s`,
          messageCount: ws.messageCount
        });
      }
    }
  });

  // Close stale connections
  staleConnections.forEach((ws) => {
    try {
      ws.close(1000, 'Connection timeout');
    } catch (error) {
      logger.error(`Error closing stale connection:`, error);
    }
  });

  // Log connection statistics every 5 minutes
  if (now % (5 * 60 * 1000) < 1000) {
    logger.info(`Connection statistics`, {
      totalConnections: connectionStats.totalConnections,
      activeConnections: connectionStats.activeConnections,
      disconnections: connectionStats.disconnections,
      errors: connectionStats.errors,
      uptime: `${Math.round(process.uptime())}s`
    });
  }
}, 60000); // Check every minute instead of every 30 seconds

// Graceful shutdown handling
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');

  // Close all connections
  clients.forEach((ws) => {
    try {
      ws.close(1000, 'Server shutting down');
    } catch (error) {
      logger.error('Error closing connection during shutdown:', error);
    }
  });

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');

  clients.forEach((ws) => {
    try {
      ws.close(1000, 'Server shutting down');
    } catch (error) {
      logger.error('Error closing connection during shutdown:', error);
    }
  });

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info(`WebSocket server running on port ${PORT}`, {
    port: PORT,
    healthCheckInterval: 60000
  });
  console.log(`Connect to: ws://localhost:${PORT}`);
});
