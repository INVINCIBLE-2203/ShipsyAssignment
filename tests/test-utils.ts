import { AppDataSource } from '../../src/config/database.config';
import { User } from '../../src/database/entities/user.entity';
import { AuthService } from '../../src/modules/auth/auth.service';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { JwtService } from '@nestjs/jwt';

export async function getTestUserToken(): Promise<{ token: string; userId: string }> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.save({ email: 'test@test.com', username: 'test', password_hash: 'test' });

    const jwtService = new JwtService({ secret: process.env.JWT_SECRET || 'secret' });
    const authService = new AuthService(userRepository, jwtService as any);
    const token = await authService.login({ id: user.id, email: user.email });

    return { token: token.accessToken, userId: user.id };
}
