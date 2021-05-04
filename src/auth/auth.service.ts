import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/user.entity';
import { JwtUser, Payload } from './auth.type';
import { ConfigService } from '@nestjs/config';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async validateUserLocal(username: string, password: string): Promise<User> {
    const user = await this.userService.findOneUsername(username);
    if (!user) throw new UnauthorizedException();
    if (!this.isMatchPassword(password, user.passwordHash))
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    return user;
  }

  async validateUserJwt(payload: Payload): Promise<User> {
    const user = await this.userService.findOnePayload(payload);
    if (!user)
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    return user;
  }

  async validateUserGoogle(profile: any): Promise<User> {
    const { emails } = profile;
    const username = emails[0].value;
    const user = await this.userService.findOneUsername(username);
    // if (!user)
    //   this.userService.register({
    //     username: emails[0].value,
    //     firstName: name.givenName,
    //     lastName: name.familyName,
    //   })
    return user;
  }

  async login(user: JwtUser) {
    const payload: Payload = { sub: user.userId, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  getCookieWithJwtToken(user: User) {
    const payload: Payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get<string>(
      'JWT_EXPIRATION_TIME',
    )}`;
  }

  async loginGoogle(req) {
    if (!req.user) {
      return 'no google user';
    }
    return {
      message: 'Google user info',
      user: req.user,
    };
  }

  isMatchPassword(plainPassword: string, hashPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, hashPassword);
  }
}
