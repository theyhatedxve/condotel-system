import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrivateDataService } from './private-data.service';
import { EncryptionService } from './encryption.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService, PrivateDataService],
  exports: [EncryptionService, PrivateDataService],
})
export class SecurityModule {}
