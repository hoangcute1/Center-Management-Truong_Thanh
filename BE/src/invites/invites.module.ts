import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { InviteToken, InviteTokenSchema } from './schemas/invite-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InviteToken.name, schema: InviteTokenSchema },
    ]),
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
