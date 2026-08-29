import { Test, TestingModule } from '@nestjs/testing';
import { CircleController } from './circle.controller';
import { CircleService } from './circle.service';

describe('CircleController', () => {
  let controller: CircleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CircleController],
      providers: [CircleService],
    }).compile();

    controller = module.get<CircleController>(CircleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
