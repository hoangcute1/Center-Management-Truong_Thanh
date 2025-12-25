import { Request } from 'express';
import { UserDocument } from '../../users/schemas/user.schema';

export interface RequestWithUser extends Request {
  user: UserDocument;
}
