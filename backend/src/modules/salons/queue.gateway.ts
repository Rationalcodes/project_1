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

  // Map of clientId -> Set of subscribed room names (for connection lifecycle tracking)
  private readonly clientRooms = new Map<string, Set<string>>();

  // Monotonic sequence counters per salon (to prevent out-of-order/stale client state overwrites)
  private readonly salonSequences = new Map<string, number>();

  handleConnection(client: Socket) {
    this.clientRooms.set(client.id, new Set());
    this.logger.log(`Client connected to QueueGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const rooms = this.clientRooms.get(client.id);
    if (rooms) {
      rooms.clear();
      this.clientRooms.delete(client.id);
    }
    this.logger.log(`Client disconnected from QueueGateway: ${client.id}`);
  }

  /**
   * Validates salon ID to prevent injection and invalid room creation
   */
  private sanitizeSalonId(salonId: unknown): string | null {
    if (typeof salonId !== 'string') return null;
    const trimmed = salonId.trim();
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(trimmed)) return null;
    return trimmed;
  }

  @SubscribeMessage('joinSalon')
  handleJoinSalon(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { salonId: string },
  ) {
    const salonId = this.sanitizeSalonId(data?.salonId);
    if (!salonId) {
      return { event: 'joinedSalon', status: 'error', message: 'Invalid salonId' };
    }

    const room = `salon_${salonId}`;
    const userRooms = this.clientRooms.get(client.id) || new Set();

    // Prevent duplicate room joining
    if (userRooms.has(room)) {
      return { event: 'joinedSalon', room, status: 'already_joined', sequence: this.salonSequences.get(salonId) || 0 };
    }

    client.join(room);
    userRooms.add(room);
    this.clientRooms.set(client.id, userRooms);

    const currentSeq = this.salonSequences.get(salonId) || 0;
    this.logger.log(`Socket ${client.id} joined room ${room} (current sequence: ${currentSeq})`);

    return {
      event: 'joinedSalon',
      room,
      salonId,
      status: 'ok',
      sequence: currentSeq,
      timestamp: new Date().toISOString(),
    };
  }

  @SubscribeMessage('leaveSalon')
  handleLeaveSalon(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { salonId: string },
  ) {
    const salonId = this.sanitizeSalonId(data?.salonId);
    if (!salonId) {
      return { event: 'leftSalon', status: 'error', message: 'Invalid salonId' };
    }

    const room = `salon_${salonId}`;
    client.leave(room);

    const userRooms = this.clientRooms.get(client.id);
    if (userRooms) {
      userRooms.delete(room);
    }

    this.logger.log(`Socket ${client.id} left room ${room}`);
    return { event: 'leftSalon', room, salonId, status: 'ok' };
  }

  /**
   * Broadcast an event strictly to subscribers of a specific salon.
   * Attaches monotonic sequence number and UTC ISO timestamp to prevent stale state overwrites.
   * Does NOT broadcast globally, preventing cross-tenant event leakage and unnecessary network overhead.
   */
  broadcastToSalon(salonId: string, eventName: string, payload: any) {
    try {
      if (!this.server) return;

      const sanitizedId = this.sanitizeSalonId(salonId);
      if (!sanitizedId) return;

      const room = `salon_${sanitizedId}`;

      // Increment monotonic sequence counter for this salon
      const nextSeq = (this.salonSequences.get(sanitizedId) || 0) + 1;
      this.salonSequences.set(sanitizedId, nextSeq);

      const eventEnvelope = {
        ...payload,
        salonId: sanitizedId,
        eventName,
        sequence: nextSeq,
        timestamp: new Date().toISOString(),
      };

      // Broadcast exclusively to the designated salon room
      this.server.to(room).emit(eventName, eventEnvelope);
    } catch (err) {
      this.logger.warn(`Failed to broadcast ${eventName} to salon ${salonId}: ${err}`);
    }
  }

  /**
   * Returns current sequence number for a salon (useful for diagnostics & tests)
   */
  getSalonSequence(salonId: string): number {
    return this.salonSequences.get(salonId) || 0;
  }
}
