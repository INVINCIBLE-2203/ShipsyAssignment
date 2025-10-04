import { AppDataSource } from '../../config/database.config';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EncryptionUtil } from '../../utils/encryption.util';
import { AppError } from '../../common/AppError';
import * as jwt from 'jsonwebtoken';
import { authConfig } from '../../config/auth.config';
import { JwtPayload, TokenResponse } from './dto/token.dto';

export class AuthService {
  private readonly userRepository = AppDataSource.getRepository(User);

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, username, password } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: [{ email }, { username }] });
    if (existingUser) {
      throw new AppError(409, 'User with this email or username already exists.');
    }

    const password_hash = await EncryptionUtil.hash(password);

    const newUser = this.userRepository.create({
      email,
      username,
      password_hash,
    });

    return this.userRepository.save(newUser);
  }

  async login(loginDto: LoginDto): Promise<TokenResponse> {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new AppError(401, 'Invalid credentials.');
    }

    const isPasswordValid = await EncryptionUtil.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials.');
    }

    return this.generateTokens({ sub: user.id, email: user.email });
  }

  async refreshToken(token: string): Promise<TokenResponse> {
    try {
      const payload = jwt.verify(token, authConfig.jwtRefresh.secret) as JwtPayload;
      const user = await this.userRepository.findOneBy({ id: payload.sub });
      if (!user) {
        throw new AppError(401, 'Invalid refresh token.');
      }
      return this.generateTokens({ sub: user.id, email: user.email });
    } catch (error) {
      throw new AppError(401, 'Invalid refresh token.');
    }
  }

  private generateTokens(payload: JwtPayload): TokenResponse {
    const accessToken = jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
    });
    const refreshToken = jwt.sign(payload, authConfig.jwtRefresh.secret, {
      expiresIn: authConfig.jwtRefresh.expiresIn,
    });
    return { accessToken, refreshToken };
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
        throw new AppError(404, 'User not found');
    }
    // It's important to not send back the password hash
    delete user.password_hash;
    return user;
  }
}
