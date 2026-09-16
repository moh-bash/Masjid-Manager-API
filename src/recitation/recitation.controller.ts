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
import { RecitationService } from './recitation.service';
import { CreateRecitationDto } from './dto/create-recitation.dto';
import { UpdateRecitationDto } from './dto/update-recitation.dto';
import { GetRecitationsQueryDto } from './dto/get-recitations-query.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('recitation')
@UseGuards(AuthGuard)
export class RecitationController {
  constructor(private readonly recitationService: RecitationService) {}

  @Post()
  create(
    @Body() createRecitationDto: CreateRecitationDto,
    @CurrentUser() user: any,
  ) {
    return this.recitationService.create(createRecitationDto, user);
  }

  @Get()
  findAll(@Query() query: GetRecitationsQueryDto) {
    return this.recitationService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recitationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecitationDto: UpdateRecitationDto,
    @CurrentUser() user: any,
  ) {
    return this.recitationService.update(id, updateRecitationDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recitationService.remove(id);
  }
}
