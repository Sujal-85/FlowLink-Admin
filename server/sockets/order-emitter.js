// Module to handle order status updates via WebSocket
// This will be used by the orders route to emit status updates

let ioInstance = null;
let userSocketMap = null;

export const setIoInstance = (io, userMap) => {
  ioInstance = io;
  userSocketMap = userMap;
};

export const emitOrderStatusUpdate = (orderId, userId, status, message = null) => {
  if (!ioInstance || !userSocketMap) {
    console.error('Socket.IO instance not initialized');
    return;
  }

  // Find customer socket by userId
  const customerSocketId = userSocketMap.get(userId);
  
  if (customerSocketId) {
    console.log(`Emitting order status update to customer ${userId} (socketId: ${customerSocketId})`);
    
    // Emit order status update to customer
    ioInstance.to(customerSocketId).emit('order:status_update', {
      orderId,
      userId,
      status,
      message: message || `Order status updated to ${status}`,
      updatedAt: new Date().toISOString()
    });
  } else {
    console.log(`Customer socket not found for userId: ${userId}`);
  }
};