import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// Expose app HTTP routes with the declared request validation and access guards.
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Return the existing root API response.
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
