import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP_AUDIT');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = response;
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Audit log detailing the request and performance
        this.logger.log(
          `[${method}] ${originalUrl} ${statusCode} - ${duration}ms - IP: ${ip} - Agent: ${userAgent}`,
        );
      }),
    );
  }
}
