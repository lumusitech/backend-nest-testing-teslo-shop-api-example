import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesModule } from './files.module';
import { FilesService } from './files.service';

// jest.mock('@nestjs/config', () => ({}));

describe('FilesModule', () => {
  let module: TestingModule;
  let filesController: FilesController;
  let filesService: FilesService;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, FilesModule],
      controllers: [FilesController],
      providers: [FilesService],
    }).compile();

    filesController = module.get<FilesController>(FilesController);
    filesService = module.get<FilesService>(FilesService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', async () => {
    expect(module).toBeDefined();
    expect(filesController).toBeDefined();
    expect(filesService).toBeDefined();
    expect(configService).toBeDefined();
  });
});
