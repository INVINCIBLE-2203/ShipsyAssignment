import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validationMiddleware } from '../../common/middleware/validation.middleware';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { jwtAuthGuard } from './guards/jwt-auth.guard';

const authRouter = Router();
const authController = new AuthController();

authRouter.post('/register', validationMiddleware(RegisterDto), authController.register);
authRouter.post('/login', validationMiddleware(LoginDto), authController.login);
authRouter.post('/refresh', authController.refreshToken);
authRouter.post('/logout', jwtAuthGuard, authController.logout);
authRouter.get('/me', jwtAuthGuard, authController.getMe);

export { authRouter };
