import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { setIoInstance } from './order-emitter.js';

// In-memory mapping of userId -> socketId for customer connections
const userSocketMap = new Map();

// In-memory mapping of adminId -> socketId for admin connections
const adminSocketMap = new Map();

export const setupAdminSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // In production, specify your frontend domains
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  io.use((socket, next) => {
    // Extract token from handshake auth
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      console.log('Socket connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, decoded) => {
      if (err) {
        console.log('Socket connection rejected: Invalid token');
        return next(new Error('Authentication error: Invalid token'));
      }

      // Check if user is admin
      if (!decoded.isAdmin) {
        console.log(`Socket connection rejected: User ${decoded.userId} is not an admin`);
        return next(new Error('Authorization error: Admin access required'));
      }

      // Attach user info to socket
      socket.decodedToken = decoded;
      console.log(`Admin socket connected: adminId=${decoded.userId}, socketId=${socket.id}`);
      next();
    });
  });

  io.on('connection', (socket) => {
    const adminId = socket.decodedToken.userId;
    
    // Store admin socket mapping
    adminSocketMap.set(adminId, socket.id);
    console.log(`Admin ${adminId} connected with socketId ${socket.id}`);

    // Handle admin connect event
    socket.emit('admin:connect', { 
      success: true, 
      message: 'Admin connected successfully',
      adminId: adminId 
    });

    // Handle order status update request from admin
    socket.on('admin:updateOrderStatus', async (data) => {
      try {
        console.log('Admin requested order status update:', data);
        
        const { orderId, userId, status, message } = data;
        
        if (!orderId || !userId || !status) {
          socket.emit('admin:error', {
            error: 'Missing required fields: orderId, userId, or status'
          });
          return;
        }

        // Validate status is one of the supported statuses
        const validStatuses = ['ORDER_CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
          socket.emit('admin:error', {
            error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
          });
          return;
        }

        // Find customer socket by userId
        const customerSocketId = userSocketMap.get(userId);
        
        if (customerSocketId) {
          console.log(`Emitting order status update to customer ${userId} (socketId: ${customerSocketId})`);
          
          // Emit order status update to customer
          io.to(customerSocketId).emit('order:status_update', {
            orderId,
            userId,
            status,
            message: message || `Order status updated to ${status}`,
            updatedAt: new Date().toISOString()
          });
          
          // Also emit to admin as confirmation
          socket.emit('admin:statusUpdateSuccess', {
            orderId,
            userId,
            status,
            message: `Order status successfully updated to ${status}`,
            updatedAt: new Date().toISOString()
          });
        } else {
          console.log(`Customer socket not found for userId: ${userId}`);
          
          // Emit to admin that customer wasn't connected
          socket.emit('admin:statusUpdateSuccess', {
            orderId,
            userId,
            status,
            message: `Order status updated to ${status}, but customer was not connected to receive the update`,
            updatedAt: new Date().toISOString(),
            customerNotConnected: true
          });
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        socket.emit('admin:error', {
          error: 'Failed to update order status: ' + error.message
        });
      }
    });

    // Handle admin disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Admin socket disconnected: adminId=${adminId}, reason=${reason}`);
      adminSocketMap.delete(adminId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error for admin:', adminId, error);
    });
  });

  // Listen for customer connections to maintain the userSocketMap
  io.of('/customer').use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Check if user is NOT an admin (customer connection)
      if (decoded.isAdmin) {
        return next(new Error('Authorization error: Customer access required'));
      }

      socket.decodedToken = decoded;
      next();
    });
  });

  io.of('/customer').on('connection', (socket) => {
    const userId = socket.decodedToken.userId;
    
    // Store customer socket mapping
    userSocketMap.set(userId, socket.id);
    console.log(`Customer ${userId} connected with socketId ${socket.id} (customer namespace)`);

    // Handle customer joining order room
    socket.on('join-order-room', (data) => {
      if (data.orderId) {
        socket.join(data.orderId);
        console.log(`Customer ${userId} joined order room: ${data.orderId}`);
      }
    });

    // Handle customer leaving order room
    socket.on('leave-order-room', (data) => {
      if (data.orderId) {
        socket.leave(data.orderId);
        console.log(`Customer ${userId} left order room: ${data.orderId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      userSocketMap.delete(userId);
      console.log(`Customer socket disconnected: userId=${userId}, reason=${reason}`);
    });
  });

  // Set the io instance for the order emitter
  setIoInstance(io, userSocketMap);

  return { io, userSocketMap, adminSocketMap };
};