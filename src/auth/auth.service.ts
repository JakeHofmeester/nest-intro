import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto, SigninDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
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

      delete user.password;

      // return the saved user
      return user;
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
      select: {
        id: true,
        firstname: true,
        lastname: true,
        password: true,
      },
    });

    // if user does not exist throw exception
    if (!user)
      throw new ForbiddenException('No user found with this email address.');

    // compare password
    const pwMatches = await argon.verify(user.password, dto.password);

    // if passwrod is incorrcect throw exception
    if (!pwMatches) throw new ForbiddenException('Incorrect password');

    // send back the user
    delete user.password;
    return user;
  }
}
