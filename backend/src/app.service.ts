import { Injectable } from '@nestjs/common';

// Implement app operations using the injected dependencies and existing business rules.
@Injectable()
export class AppService {
  // Return the existing root API response.
  getHello(): string {
    return 'Hello World!';
  }
}
