import * as bcrypt from 'bcrypt';
import { authConfig } from '../config/auth.config';

export class EncryptionUtil {
  static hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, authConfig.bcrypt.saltRounds);
  }

  static compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
