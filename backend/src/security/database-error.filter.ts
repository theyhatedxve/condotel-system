import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

// Avoid framework logging of ORM parameters, protected fields or provider payloads.
@Catch()
export class DatabaseErrorFilter implements ExceptionFilter {
  // Convert known database conflicts and unexpected internal errors into safe HTTP
  // responses.
  catch(error: unknown, host: ArgumentsHost) {
    const exception =
      error instanceof HttpException
        ? error
        : error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ? new ConflictException(
              'An account or record with these unique details already exists.',
            )
          : new InternalServerErrorException(
              'The operation could not be completed.',
            );
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(exception.getStatus())
      .json(exception.getResponse());
  }
}
