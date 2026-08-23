import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@GetUser('userId') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get(':id')
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
