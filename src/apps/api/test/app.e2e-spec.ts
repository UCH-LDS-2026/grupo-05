import { execSync } from 'child_process';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');

// E2E real: levanta el AppModule completo contra un Postgres de verdad,
// en un schema aislado (e2e_test). Requiere la base corriendo:
//   docker compose up -d db     (postgres en localhost:5433)
// El schema se migra y se limpia automáticamente.

const DB_BASE =
  process.env.E2E_DB_BASE ??
  'postgresql://spot:spot_dev_pw@localhost:5433/spot';
const SCHEMA = 'e2e_test';
const TEST_DB_URL = `${DB_BASE}?schema=${SCHEMA}`;

// Imports que dependen del cliente Prisma se cargan después de fijar el env.
let AppModule: any;
let PrismaService: any;

describe('Spot API (e2e)', () => {
  let app: INestApplication;
  let prisma: any;
  let kioskId: string;
  let token: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.JWT_SECRET = 'e2e-secret-no-prod';
    process.env.JWT_EXPIRES_IN = '7d';

    // 1. Crear el schema aislado y migrar.
    const { PrismaClient } = require('@prisma/client');
    const base = new PrismaClient({ datasources: { db: { url: `${DB_BASE}?schema=public` } } });
    await base.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`);
    await base.$disconnect();

    execSync('pnpm exec prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: 'pipe',
    });

    // 2. Levantar la app real.
    AppModule = require('../src/app.module').AppModule;
    PrismaService = require('../src/prisma/prisma.service').PrismaService;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // 3. Limpiar y sembrar datos mínimos.
    await prisma.redemption.deleteMany();
    await prisma.review.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.player.deleteMany();
    await prisma.inviteCode.deleteMany();
    await prisma.kiosk.deleteMany();

    const kiosk = await prisma.kiosk.create({
      data: { name: 'Yes E2E', address: 'Calle Falsa 123', city: 'Mendoza' },
    });
    kioskId = kiosk.id;
  }, 120_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.redemption.deleteMany();
      await prisma.review.deleteMany();
      await prisma.visit.deleteMany();
      await prisma.promotion.deleteMany();
      await prisma.player.deleteMany();
      await prisma.inviteCode.deleteMany();
      await prisma.kiosk.deleteMany();
    }
    if (app) await app.close();
  });

  it('POST /auth/login crea un player con código de invitación y devuelve token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ code: 'E2ECODE', name: 'Tester E2E' })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('PLAYER');
    expect(res.body.player).toMatchObject({ name: 'Tester E2E' });
    token = res.body.token;
  });

  it('rechaza /kiosks sin token (401)', async () => {
    await request(app.getHttpServer()).get('/kiosks').expect(401);
  });

  it('GET /kiosks devuelve el kiosco sembrado', async () => {
    const res = await request(app.getHttpServer())
      .get('/kiosks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((k: any) => k.id === kioskId)).toBe(true);
  });

  it('POST /kiosks/:id/visits registra una visita y se refleja en el detalle', async () => {
    await request(app.getHttpServer())
      .post(`/kiosks/${kioskId}/visits`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/kiosks/${kioskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detail.body.myVisits).toBe(1);
    expect(detail.body.id).toBe(kioskId);
  });

  it('POST /kiosks/:id/reviews guarda una reseña y actualiza el promedio', async () => {
    await request(app.getHttpServer())
      .post(`/kiosks/${kioskId}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ attention: 5, variety: 4, cleanliness: 5, prices: 3, ambiance: 4 })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/kiosks/${kioskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detail.body.avgRating).toBeGreaterThan(0);
    expect(detail.body.myReview).not.toBeNull();
  });
});
