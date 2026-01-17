import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET || 'your-secret-key-here-change-in-production',
  signOptions: { 
    expiresIn: '1h'
  },
};