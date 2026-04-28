import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'social-hub',
  cors: {
    origin: '*', // Adjust to your frontend domain in production
  },
})
export class SocialHubGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocialHubGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} failed to connect: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      // Join a user-specific room for targeted broadcasts
      client.join(`user_${userId}`);
      this.logger.log(`Client ${client.id} (User: ${userId}) connected to Social Hub`);
    } catch (e) {
      this.logger.warn(`Client ${client.id} failed to connect: Invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  private extractToken(client: Socket): string | undefined {
    // Check both auth header and query for flexibility
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return client.handshake.query?.token as string | undefined;
  }

  /**
   * Broadcast a new interaction to a specific user
   */
  broadcastInteraction(userId: number, interaction: any) {
    this.server.to(`user_${userId}`).emit('interaction:created', interaction);
    this.logger.debug(`Broadcasted interaction to user_${userId}`);
  }

  /**
   * Broadcast a metric update to a specific user
   */
  broadcastMetricUpdate(userId: number, update: any) {
    this.server.to(`user_${userId}`).emit('metric:updated', update);
  }
}
