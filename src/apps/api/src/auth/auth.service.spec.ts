import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

const mockPrisma = {
  inviteCode: { findUnique: jest.fn(), create: jest.fn() },
  player: { create: jest.fn() },
  owner: { findUnique: jest.fn(), create: jest.fn() },
  admin: { findUnique: jest.fn() },
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('fake-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwt.signAsync.mockResolvedValue('fake-jwt-token');
    service = new AuthService(mockPrisma as any, mockJwt as any);
  });

  describe('login (player por invite code)', () => {
    it('re-emite token para un código que ya tiene player', async () => {
      mockPrisma.inviteCode.findUnique.mockResolvedValue({
        id: 'inv-1',
        code: 'DEMO',
        player: { id: 'p1', name: 'Sofi' },
      });

      const res = await service.login({ code: 'demo' } as any);

      expect(res).toEqual({
        token: 'fake-jwt-token',
        role: 'PLAYER',
        player: { id: 'p1', name: 'Sofi' },
      });
      // normaliza el código a mayúsculas
      expect(mockPrisma.inviteCode.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code: 'DEMO' } }),
      );
      expect(mockPrisma.player.create).not.toHaveBeenCalled();
    });

    it('crea el player cuando el código no tiene uno y se pasa nombre', async () => {
      mockPrisma.inviteCode.findUnique.mockResolvedValue({
        id: 'inv-2',
        code: 'NUEVO',
        player: null,
      });
      mockPrisma.player.create.mockResolvedValue({ id: 'p2', name: 'Gabriel' });

      const res = await service.login({ code: 'NUEVO', name: 'Gabriel' } as any);

      expect(mockPrisma.player.create).toHaveBeenCalled();
      expect(res.player).toEqual({ id: 'p2', name: 'Gabriel' });
    });

    it('rechaza si el código no tiene player y no se pasa nombre', async () => {
      mockPrisma.inviteCode.findUnique.mockResolvedValue({
        id: 'inv-3',
        code: 'SINNOMBRE',
        player: null,
      });

      await expect(service.login({ code: 'SINNOMBRE' } as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('crea el código al vuelo si no existe', async () => {
      mockPrisma.inviteCode.findUnique.mockResolvedValue(null);
      mockPrisma.inviteCode.create.mockResolvedValue({
        id: 'inv-new',
        code: 'INVENTADO',
        player: null,
      });
      mockPrisma.player.create.mockResolvedValue({ id: 'p3', name: 'Ana' });

      const res = await service.login({ code: 'inventado', name: 'Ana' } as any);

      expect(mockPrisma.inviteCode.create).toHaveBeenCalled();
      expect(res.player).toEqual({ id: 'p3', name: 'Ana' });
    });
  });

  describe('registerOwner', () => {
    it('rechaza si ya existe un owner con ese email', async () => {
      mockPrisma.owner.findUnique.mockResolvedValue({ id: 'o1' });

      await expect(
        service.registerOwner({
          name: 'Dueño',
          email: 'dup@spot.dev',
          password: 'x',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('crea el owner (con password hasheado) y devuelve token + rol OWNER', async () => {
      mockPrisma.owner.findUnique.mockResolvedValue(null);
      mockPrisma.owner.create.mockImplementation(({ data }: any) => ({
        id: 'o-new',
        name: data.name,
        status: 'PENDIENTE_VALIDACION',
        passwordHash: data.passwordHash,
      }));

      const res = await service.registerOwner({
        name: 'Nuevo Dueño',
        email: 'NEW@Spot.dev',
        password: 'secret123',
      } as any);

      expect(res).toMatchObject({
        token: 'fake-jwt-token',
        role: 'OWNER',
        owner: { id: 'o-new', name: 'Nuevo Dueño', status: 'PENDIENTE_VALIDACION' },
      });
      // el email se normaliza a minúsculas
      expect(mockPrisma.owner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'new@spot.dev' }),
        }),
      );
      // el password NO se guarda en texto plano
      const created = mockPrisma.owner.create.mock.calls[0][0].data;
      expect(created.passwordHash).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', created.passwordHash)).toBe(true);
    });
  });

  describe('loginOwner', () => {
    it('rechaza credenciales inválidas (owner inexistente)', async () => {
      mockPrisma.owner.findUnique.mockResolvedValue(null);

      await expect(
        service.loginOwner({ email: 'no@hay.com', password: 'x' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza si la contraseña no coincide', async () => {
      mockPrisma.owner.findUnique.mockResolvedValue({
        id: 'o1',
        name: 'Dueño',
        status: 'VALIDADO',
        passwordHash: await bcrypt.hash('la-correcta', 10),
      });

      await expect(
        service.loginOwner({ email: 'o@spot.dev', password: 'la-incorrecta' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('loguea con credenciales correctas', async () => {
      mockPrisma.owner.findUnique.mockResolvedValue({
        id: 'o1',
        name: 'Dueño',
        status: 'VALIDADO',
        passwordHash: await bcrypt.hash('correcta', 10),
      });

      const res = await service.loginOwner({
        email: 'o@spot.dev',
        password: 'correcta',
      } as any);

      expect(res).toMatchObject({
        token: 'fake-jwt-token',
        role: 'OWNER',
        owner: { id: 'o1', name: 'Dueño', status: 'VALIDADO' },
      });
    });
  });
});
