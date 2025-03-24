import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('receiveMessage')
  async receiveMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket, // 지금 연결된 클라이언트 소켓 객체
  ) {
    console.log('receiveMessage', data);
    console.log('client', client);
    client.emit('receiveMessage', { message: 'Hello, client!' });
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.emit('sendMessage', { ...data, from: 'server' });
  }
}
