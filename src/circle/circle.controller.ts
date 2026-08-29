import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CircleService } from './circle.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';

@Controller('circle')
export class CircleController {
  constructor(private readonly circleService: CircleService) {}

  @Post()
  create(@Body() createCircleDto: CreateCircleDto) {
    return this.circleService.create(createCircleDto);
  }

  @Get()
  findAll() {
    return this.circleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.circleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCircleDto: UpdateCircleDto) {
    return this.circleService.update(+id, updateCircleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.circleService.remove(+id);
  }
}
