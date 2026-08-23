import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { QuerySpaceDto } from './dto/query-space.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Public()
  @Get()
  async findAll(@Query() query: QuerySpaceDto) {
    return this.spacesService.findAll(query);
  }

  @Roles(Role.HOST)
  @Get('my-spaces')
  async findMySpaces(@GetUser('userId') hostId: string) {
    return this.spacesService.findMySpaces(hostId);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }

  @Roles(Role.HOST)
  @Post()
  async create(@GetUser('userId') hostId: string, @Body() createSpaceDto: CreateSpaceDto) {
    return this.spacesService.create(hostId, createSpaceDto);
  }

  @Roles(Role.HOST)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @GetUser('userId') hostId: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
  ) {
    return this.spacesService.update(id, hostId, updateSpaceDto);
  }

  @Roles(Role.HOST)
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser('userId') hostId: string) {
    return this.spacesService.remove(id, hostId);
  }
}
