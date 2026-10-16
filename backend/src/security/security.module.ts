import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrivateDataService } from './private-data.service';
import { EncryptionService } from './encryption.service';

// Wire the security controllers, services, and imported dependencies into Nest.
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService, PrivateDataService],
  exports: [EncryptionService, PrivateDataService],
})
export class SecurityModule {}
