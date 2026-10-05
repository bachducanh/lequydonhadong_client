import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser, Roles } from '../../common/decorators';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('Quản trị · Người dùng')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: UserQueryDto) {
    return this.users.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: AuthUser) {
    return this.users.update(id, dto, actor.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.users.remove(id, actor.id);
  }
}
