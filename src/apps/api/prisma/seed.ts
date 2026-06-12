import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Códigos de invitación de demo. SPOT2026 / YESMZA quedan libres para activar
// con tu nombre. DEMO viene pre-activado para el player "Sofi" (con datos).
const INVITE_CODES = ['SPOT2026', 'YESMZA', 'DEMO', 'SEED'];

const TAG_NAMES = [
  '24hs',
  'Panchos',
  'Helados',
  'Carga SUBE',
  'Cafetería',
  'Atención piola',
  'Combos',
];

type KioskSeed = {
  name: string;
  address: string;
  brand: string | null;
  lat: number;
  lng: number;
  tags: string[];
};

const KIOSKS: KioskSeed[] = [
  {
    name: 'Yes Centro',
    address: 'Av. San Martín 1240, Ciudad',
    brand: 'Yes',
    lat: -32.8895,
    lng: -68.8458,
    tags: ['24hs', 'Cafetería', 'Carga SUBE'],
  },
  {
    name: 'Yes Parque Central',
    address: 'Av. Vicente Zapata 320, Ciudad',
    brand: 'Yes',
    lat: -32.8902,
    lng: -68.8521,
    tags: ['Panchos', 'Helados', 'Combos'],
  },
  {
    name: 'Yes Godoy Cruz',
    address: 'Av. San Martín Sur 855, Godoy Cruz',
    brand: 'Yes',
    lat: -32.9261,
    lng: -68.8412,
    tags: ['24hs', 'Atención piola'],
  },
  {
    name: 'Yes Chacras',
    address: 'Viamonte 451, Chacras de Coria',
    brand: 'Yes',
    lat: -32.9789,
    lng: -68.8736,
    tags: ['Cafetería', 'Helados', 'Atención piola'],
  },
  {
    name: 'Kiosco El Trébol',
    address: 'Belgrano 1120, Ciudad',
    brand: null,
    lat: -32.8867,
    lng: -68.8401,
    tags: ['Panchos', 'Combos'],
  },
  {
    name: 'Yes Las Heras',
    address: 'Av. San Martín 2890, Las Heras',
    brand: 'Yes',
    lat: -32.8503,
    lng: -68.8289,
    tags: ['24hs', 'Carga SUBE', 'Combos'],
  },
];

// Credenciales demo del lado B2B (two-sided). Password común para la demo.
const DEMO_PASSWORD = 'spot1234';
const OWNER_EMAIL = 'owner@spot.dev';
const ADMIN_EMAIL = 'admin@spot.dev';

async function main() {
  console.log('🧹 Limpiando datos previos...');
  await prisma.redemption.deleteMany();
  await prisma.promotionRule.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.review.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.kioskTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.player.deleteMany();
  await prisma.kiosk.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.inviteCode.deleteMany();

  console.log('🎟️  Creando códigos de invitación...');
  const invites: Record<string, string> = {};
  for (const code of INVITE_CODES) {
    const inv = await prisma.inviteCode.create({ data: { code } });
    invites[code] = inv.id;
  }

  console.log('🏷️  Creando tags...');
  const tags: Record<string, string> = {};
  for (const name of TAG_NAMES) {
    const t = await prisma.tag.create({ data: { name } });
    tags[name] = t.id;
  }

  console.log('🛠️  Creando admin y owner de demo...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.admin.create({
    data: { name: 'Admin Spot', email: ADMIN_EMAIL, passwordHash },
  });
  // Owner YA validado, con sus kioscos (lado two-sided listo para demo).
  const owner = await prisma.owner.create({
    data: {
      name: 'Dueño Yes',
      email: OWNER_EMAIL,
      passwordHash,
      status: 'VALIDADO',
    },
  });

  console.log('🏪 Creando kioscos...');
  const kioskIds: string[] = [];
  for (const [i, k] of KIOSKS.entries()) {
    const created = await prisma.kiosk.create({
      data: {
        name: k.name,
        address: k.address,
        brand: k.brand,
        lat: k.lat,
        lng: k.lng,
        // Los 3 primeros kioscos pertenecen al owner de demo; el resto quedan
        // sin dueño (pre-cargados por la plataforma, reclamables a futuro).
        ownerId: i < 3 ? owner.id : null,
        tags: {
          create: k.tags.map((tagName) => ({ tagId: tags[tagName] })),
        },
      },
    });
    kioskIds.push(created.id);
  }

  console.log('🎁 Creando promoción de ejemplo (motor de reglas)...');
  // "3+ visitas en los últimos 7 días → coca chica gratis, 1 canje por player/semana"
  await prisma.promotion.create({
    data: {
      kioskId: kioskIds[0], // Yes Centro (del owner)
      title: 'Fidelidad: 3 visitas → Coca gratis',
      description:
        'Si visitás 3 o más veces en la última semana, te llevás una Coca chica gratis.',
      rewardType: 'FREE_PRODUCT',
      rewardProduct: 'Coca-Cola 237ml',
      capPerPlayer: 1,
      capPerPeriod: 1,
      periodDays: 7,
      rules: {
        create: [{ type: 'FREQUENCY', minVisits: 3, windowDays: 7 }],
      },
    },
  });

  console.log('👤 Creando player de demo (Sofi) con actividad...');
  const sofi = await prisma.player.create({
    data: { name: 'Sofi', inviteCodeId: invites['DEMO'] },
  });

  // Sofi visitó y reseñó algunos kioscos para que la demo arranque con datos.
  const seedActivity = [
    { idx: 0, r: { attention: 5, variety: 4, cleanliness: 5, prices: 3, ambiance: 4 }, comment: 'El de la mañana siempre re amable 🙌' },
    { idx: 1, r: { attention: 4, variety: 5, cleanliness: 4, prices: 4, ambiance: 5 }, comment: 'Los panchos un golazo.' },
    { idx: 3, r: { attention: 5, variety: 3, cleanliness: 5, prices: 3, ambiance: 5 }, comment: 'Hermoso para sentarse con un café.' },
  ];
  for (const a of seedActivity) {
    const kioskId = kioskIds[a.idx];
    await prisma.visit.createMany({
      data: [{ playerId: sofi.id, kioskId }, { playerId: sofi.id, kioskId }],
    });
    await prisma.review.create({
      data: { playerId: sofi.id, kioskId, ...a.r, comment: a.comment },
    });
  }

  console.log('\n✅ Seed completo:');
  console.log(`   - ${KIOSKS.length} kioscos (3 del owner de demo)`);
  console.log(`   - ${TAG_NAMES.length} tags + 1 promoción de ejemplo`);
  console.log(`   - Player: códigos SPOT2026, YESMZA (libres) · DEMO (Sofi pre-cargada)`);
  console.log(`   - Owner:  ${OWNER_EMAIL} / ${DEMO_PASSWORD} (VALIDADO)`);
  console.log(`   - Admin:  ${ADMIN_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
