import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStatic } from 'passport';
import { authConfig } from '../../../config/auth.config';
import { AppDataSource } from '../../../config/database.config';
import { User } from '../../../database/entities/user.entity';

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: authConfig.jwt.secret,
};

export const applyJwtStrategy = (passport: PassportStatic) => {
  passport.use(
    new Strategy(options, async (payload, done) => {
      try {
        const user = await AppDataSource.getRepository(User).findOneBy({ id: payload.sub });
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};
