import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthPlayer {
  id: string;
  name: string;
}

export const CurrentPlayer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPlayer => {
    return ctx.switchToHttp().getRequest().player;
  },
);
