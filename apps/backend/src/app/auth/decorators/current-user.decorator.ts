import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ITokenPayload } from '@cadena24-wms/shared';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ITokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as ITokenPayload;
  }
);
