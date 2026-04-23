import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Extracts tenant context from the JWT payload (set by JwtStrategy)
 * and makes it available on request.tenantId for all downstream handlers.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    // tenantId is injected by JwtStrategy.validate() into request.user
    if (request.user?.tenantId) {
      request.tenantId = request.user.tenantId;
    }
    return next.handle();
  }
}