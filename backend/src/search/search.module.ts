import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { SearchController } from './search.controller';

import { SearchService } from './search.service';

// Wire the search controllers, services, and imported dependencies into Nest.
@Module({
  imports: [AuthModule],

  controllers: [SearchController],

  providers: [SearchService],

  exports: [SearchService],
})
export class SearchModule {}
