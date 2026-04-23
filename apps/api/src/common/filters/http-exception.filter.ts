import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || message;
        if (Array.isArray(resp.message)) {
          // ValidationPipe errors
          errors = this.formatValidationErrors(resp.message as string[]);
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handlePrismaError(error: PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: `Unique constraint violation on field: ${(error.meta?.target as string[])?.join(', ')}`,
        };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Record not found' };
      case 'P2003':
        return { status: HttpStatus.BAD_REQUEST, message: 'Foreign key constraint failed' };
      case 'P2014':
        return { status: HttpStatus.BAD_REQUEST, message: 'Relation violation' };
      default:
        this.logger.error(`Prisma error ${error.code}: ${error.message}`);
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error' };
    }
  }

  private formatValidationErrors(messages: string[]): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    for (const msg of messages) {
      const parts = msg.split(' ');
      const field = parts[0];
      if (!errors[field]) errors[field] = [];
      errors[field].push(msg);
    }
    return errors;
  }
}