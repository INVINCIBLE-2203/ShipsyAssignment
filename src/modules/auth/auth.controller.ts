import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export class AuthController {
  private readonly authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.register(req.body as RegisterDto);
      // Avoid sending password hash in response
      const { password_hash, ...result } = user;
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await this.authService.login(req.body as LoginDto);
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }
        const tokens = await this.authService.refreshToken(refreshToken);
        res.status(200).json(tokens);
    } catch (error) {
        next(error);
    }
  }

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // req.user is populated by the jwtAuthGuard
        const userId = (req.user as any).id;
        const user = await this.authService.getMe(userId);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
  }

  logout = async (req: Request, res: Response, next: NextFunction) => {
    // For JWT, logout is typically handled on the client-side by deleting the token.
    // If a token blacklist is implemented, the logic would go here.
    res.status(200).json({ message: 'Logged out successfully.' });
  }
}
