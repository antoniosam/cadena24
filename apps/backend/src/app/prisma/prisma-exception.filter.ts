import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  override catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Mapping relevant Prisma Error Codes to HTTP Status Codes
    // Reference: https://www.prisma.io/docs/reference/api-reference/error-reference#prismaclientknownrequesterror
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint failed
        const status = HttpStatus.CONFLICT;
        const target = (exception.meta?.['target'] as string[]) || [];
        const message = `Conflict: A record with this unique value already exists (target: ${target.join(', ')})`;

        response.status(status).json({
          statusCode: status,
          message: message,
          error: 'Conflict',
        });
        break;
      }
      case 'P2003': {
        // Foreign key constraint failed
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message: `Foreign key constraint failed on the field: ${exception.meta?.['field_name']}`,
          error: 'Bad Request',
        });
        break;
      }
      case 'P2025': {
        // Record not found
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: 'The requested record was not found.',
          error: 'Not Found',
        });
        break;
      }
      default:
        // Let the default exception handler deal with other Prisma errors
        super.catch(exception, host);
        break;
    }
  }
}
