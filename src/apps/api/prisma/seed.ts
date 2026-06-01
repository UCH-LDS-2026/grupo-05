import { PrismaClient } from '@prisma/client';

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

async function main() {
  console.log('🧹 Limpiando datos previos...');
  await prisma.review.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.kioskTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.player.deleteMany();
  await prisma.kiosk.deleteMany();
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

  console.log('🏪 Creando kioscos...');
  const kioskIds: string[] = [];
  for (const k of KIOSKS) {
    const created = await prisma.kiosk.create({
      data: {
        name: k.name,
        address: k.address,
        brand: k.brand,
        lat: k.lat,
        lng: k.lng,
        tags: {
          create: k.tags.map((tagName) => ({ tagId: tags[tagName] })),
        },
      },
    });
    kioskIds.push(created.id);
  }

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
  console.log(`   - ${KIOSKS.length} kioscos`);
  console.log(`   - ${TAG_NAMES.length} tags`);
  console.log(`   - Códigos para activar: SPOT2026, YESMZA (ingresá tu nombre)`);
  console.log(`   - Código pre-activado: DEMO (player "Sofi")`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
