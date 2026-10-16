import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { UserRole } from '../generated/prisma/enums';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { SearchQueryDto } from './search-query.dto';

import { SearchService } from './search.service';

// Expose search HTTP routes with the declared request validation and access guards.
@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // Search authorized management records using exact contact indexes and partial
  // names/reference fields.
  @Get()
  search(
    @Query()
    query: SearchQueryDto,
  ) {
    return this.searchService.search(query.q);
  }
}
