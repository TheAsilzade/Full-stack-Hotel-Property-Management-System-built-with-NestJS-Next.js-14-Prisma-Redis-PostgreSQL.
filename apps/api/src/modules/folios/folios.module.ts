import { Module } from '@nestjs/common';
import { FoliosController } from './folios.controller';
import { FoliosService } from './folios.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FoliosController],
  providers: [FoliosService],
  exports: [FoliosService],
})
export class FoliosModule {}