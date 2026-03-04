import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  it('should return true (allow) when route has @Public() metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should call super.canActivate() when route is NOT @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext();

    // Mock the parent AuthGuard's canActivate
    const parentCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);

    guard.canActivate(context);

    expect(parentCanActivate).toHaveBeenCalledWith(context);
    parentCanActivate.mockRestore();
  });

  it('should use IS_PUBLIC_KEY = "isPublic" metadata key', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('should check both handler and class metadata with getAllAndOverride', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext();

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
