import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { SessionsModule } from './sessions/sessions.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { GoalsModule } from './goals/goals.module';
import { TuitionModule } from './tuition/tuition.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { FeedbackModule } from './feedback/feedback.module';
import { InvitesModule } from './invites/invites.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { BranchesModule } from './branches/branches.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
      }),
    }),
    AuthModule,
    UsersModule,
    ClassesModule,
    SessionsModule,
    AttendanceModule,
    AssessmentsModule,
    GoalsModule,
    TuitionModule,
    NotificationsModule,
    ChatModule,
    FeedbackModule,
    InvitesModule,
    ApprovalsModule,
    BranchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
