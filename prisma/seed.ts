import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.link.upsert({
    where: { slug: 'meuapp' },
    update: {},
    create: {
      slug: 'meuapp',
      iosUrl: 'https://apps.apple.com/app/idSEU_APP',
      androidUrl: 'https://play.google.com/store/apps/details?id=SEU_APP',
      desktopUrl: 'https://seusite.com/app'
    }
  });
  console.log('Seed OK');
}
main().finally(() => prisma.$disconnect());
