import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Give controller parameters the account that the authentication guard attached.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.user;
  },
);
