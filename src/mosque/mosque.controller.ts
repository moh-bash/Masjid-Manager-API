import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MosqueService } from './mosque.service';
import { CreateMosqueDto } from './dto/create-mosque.dto';
import { UpdateMosqueDto } from './dto/update-mosque.dto';
import { Role } from '../users/enums/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('mosques')
export class MosqueController {
  constructor(private readonly mosqueService: MosqueService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  create(@Body() createMosqueDto: CreateMosqueDto) {
    return this.mosqueService.create(createMosqueDto);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.mosqueService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mosqueService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMosqueDto: UpdateMosqueDto) {
    return this.mosqueService.update(+id, updateMosqueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mosqueService.remove(id);
  }
}
