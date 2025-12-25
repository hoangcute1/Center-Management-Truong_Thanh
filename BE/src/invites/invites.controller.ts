import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import type { RequestWithUser } from '../common/interfaces/request-with-user';
import { Req } from '@nestjs/common';

@ApiTags('invites')
@Controller('invites')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('create')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin tạo invite token 1 lần, có expiry' })
  create(@Body() dto: CreateInviteDto, @Req() req: RequestWithUser) {
    return this.invitesService.create(dto, (req.user as any)?._id?.toString());
  }
}
