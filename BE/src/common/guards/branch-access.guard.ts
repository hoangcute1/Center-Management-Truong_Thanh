import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from '../interfaces/request-with-user';
import { UserRole } from '../enums/role.enum';

export const SKIP_BRANCH_CHECK_KEY = 'skipBranchCheck';

/**
 * Guard để kiểm tra quyền truy cập theo chi nhánh
 * - Admin: có thể truy cập tất cả chi nhánh
 * - Các role khác: chỉ có thể truy cập dữ liệu của chi nhánh mình
 */
@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Kiểm tra xem có skip branch check không
    const skipBranchCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_BRANCH_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipBranchCheck) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Missing authenticated user');
    }

    // Admin có thể truy cập tất cả
    if (user.role === UserRole.Admin) {
      return true;
    }

    // Lấy branchId từ query, params, hoặc body
    const requestBranchId =
      request.query?.branchId ||
      request.params?.branchId ||
      request.body?.branchId;

    // Nếu request yêu cầu branchId cụ thể, kiểm tra xem có khớp với user không
    if (requestBranchId && requestBranchId !== user.branchId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu của chi nhánh khác',
      );
    }

    return true;
  }
}
