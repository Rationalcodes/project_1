import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/queue',
  transports: ['websocket', 'polling'],
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QueueGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to QueueGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from QueueGateway: ${client.id}`);
  }

  @SubscribeMessage('joinSalon')
  handleJoinSalon(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { salonId: string },
  ) {
    if (data?.salonId) {
      const room = `salon_${data.salonId}`;
      client.join(room);
      this.logger.log(`Socket ${client.id} joined room ${room}`);
      return { event: 'joinedSalon', room, status: 'ok' };
    }
  }

  @SubscribeMessage('leaveSalon')
  handleLeaveSalon(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { salonId: string },
  ) {
    if (data?.salonId) {
      const room = `salon_${data.salonId}`;
      client.leave(room);
      this.logger.log(`Socket ${client.id} left room ${room}`);
      return { event: 'leftSalon', room, status: 'ok' };
    }
  }

  /**
   * Broadcast an event to all subscribers of a specific salon
   */
  broadcastToSalon(salonId: string, eventName: string, payload: any) {
    try {
      if (this.server) {
        const room = `salon_${salonId}`;
        this.server.to(room).emit(eventName, payload);
        // Also emit globally for any multi-salon monitors
        this.server.emit(`salon:${salonId}:${eventName}`, payload);
      }
    } catch (err) {
      this.logger.warn(`Failed to broadcast ${eventName} to salon ${salonId}: ${err}`);
    }
  }
}
