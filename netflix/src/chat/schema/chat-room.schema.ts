import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Chat } from './chat.schema';
import { User } from 'src/user/schema/user.schema';

@Schema({
  timestamps: true,
})
export class ChatRoom extends Document {
  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
  })
  users: User[];

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'Chat',
      },
    ],
  })
  chats: Chat[];
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
