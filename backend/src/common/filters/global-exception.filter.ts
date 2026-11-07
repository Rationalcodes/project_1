import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message = typeof response === 'object' && response !== null && 'message' in response
        ? (response as any).message
        : response;
      errorType = exception.name;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      errorType = `PrismaError_${exception.code}`;
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'A duplicate record with this unique identifier already exists';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'The requested resource was not found';
          break;
        case 'P2024':
        case 'P2028':
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = 'Database connection pool is temporarily busy. Please retry shortly.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database operation failed with invalid parameters';
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database service temporarily unreachable. Please retry shortly.';
      errorType = 'PrismaInitializationError';
    } else if (exception instanceof Error) {
      errorType = exception.name || 'Error';
      // In production, keep 500 messages generic to prevent internal leakages
      message = process.env.NODE_ENV === 'development' ? exception.message : 'Internal server error';
    }

    // Structured sanitized log with correlation ID
    const sanitizedLog = {
      event: 'http.request.exception',
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: status,
      errorType,
      ip: request.ip,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(sanitizedLog), exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(JSON.stringify(sanitizedLog));
    }

    // Fastify reply
    const formattedResponse = {
      statusCode: status,
      message,
      error: errorType,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.id,
    };

    reply.code(status).send(formattedResponse);
  }
}
