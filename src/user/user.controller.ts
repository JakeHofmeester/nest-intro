import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/Decorator';
import { JwtGuard } from 'src/auth/guard';
import { Users } from '@prisma/client'

@UseGuards (JwtGuard)
@Controller('users')
export class UserController {
	@Get('me')
	getMe(@GetUser('id')userId: Users) {
		return {userId}
	}
}
