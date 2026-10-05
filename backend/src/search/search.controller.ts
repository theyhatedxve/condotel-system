import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  UserRole,
} from '../generated/prisma/enums';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  SearchQueryDto,
} from './dto/search-query.dto';

import {
  SearchService,
} from './search.service';

@Controller('search')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(
  UserRole.STAFF,
  UserRole.ADMIN,
)
export class SearchController {
  constructor(
    private readonly searchService:
      SearchService,
  ) {}

  @Get()
  search(
    @Query()
    query:
      SearchQueryDto,
  ) {
    return this.searchService
      .search(
        query.q,
      );
  }
}