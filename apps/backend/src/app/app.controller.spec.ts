import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cadena24 WMS API is running');
      expect(result.data).toHaveProperty('status', 'healthy');
      expect(result.data).toHaveProperty('version', '1.0.0');
      expect(result.timestamp).toBeDefined();
    });
  });
});
