import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [UsersModule, ClassesModule, BranchesModule],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
