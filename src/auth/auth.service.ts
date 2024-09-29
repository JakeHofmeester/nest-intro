import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto, SigninDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';


@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {}
  async signup(dto: SignupDto) {
    // generate password hash
    const password = await argon.hash(dto.password);
    // save new user in the db
    try {
      const user = await this.prisma.users.create({
        data: {
          email: dto.email,
          password,
          firstname: dto.firstname,
          lastname: dto.lastname,
        },
      });

      // return the saved user
      
      const token = await this.signToken(user.id, user.email);

      return {
        UserId: user.id,
        ...token
      }

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'This email address is already registered.',
          );
        }
      }
      throw error;
    }
  }

  async signin(dto: SigninDto) {
    // find the user by email
    const user = await this.prisma.users.findUnique({
      where: {
        email: dto.email,
      },
    });

    // if user does not exist throw exception
    if (!user)
      throw new ForbiddenException('No user found with this email address.');

    // compare password
    const pwMatches = await argon.verify(user.password, dto.password);

    // if passwrod is incorrcect throw exception
    if (!pwMatches) throw new ForbiddenException('Incorrect password');

    // send back the JWT
    return this.signToken(user.id, user.email);
  }
  async signToken(userId: number, email: string): Promise<{access_token: string}>  {
    const payload = {
      sub: userId,
      email
    };

    const secret = this.config.get('JWT_SECRET')

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret
    })
    return {
      access_token: token,
    }
  }
}
