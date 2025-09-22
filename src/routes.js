import { PrismaClient, Platform } from '@prisma/client';
import { detectPlatform } from './device.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerRoutes(app) {
  app.get('/l/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const link = await prisma.link.findUnique({ where: { slug } });

      if (!link || !link.isActive) return res.status(404).send('Link não encontrado');

      const ua = req.headers['user-agent'] || '';
      const platform = detectPlatform(ua);

      // registra clique
      await prisma.click.create({
        data: {
          linkId: link.id,
          platform: Platform[platform] ?? Platform.UNKNOWN,
          userAgent: ua.slice(0, 1000),
          ip: req.ip,
          referer: req.get('referer') || null
        }
      });

      if (platform === 'IOS') return res.redirect(link.iosUrl);
      if (platform === 'ANDROID') return res.redirect(link.androidUrl);

      // fallback: se tiver desktopUrl, manda pra ela;
      // senão mostra uma página com botões das lojas
      if (link.desktopUrl) return res.redirect(link.desktopUrl);

      return res.sendFile(path.join(__dirname, 'views', 'open-on-desktop.html'));
    } catch (e) {
      console.error(e);
      return res.status(500).send('Erro interno');
    }
  });

  // Admin mínimo (JSON) – criar/editar links (poderia proteger com token)
  app.post('/admin/links', expressJsonGuard, async (req, res) => {
    const { slug, iosUrl, androidUrl, desktopUrl } = req.body || {};
    if (!slug || !iosUrl || !androidUrl) {
      return res.status(400).json({ error: 'slug, iosUrl e androidUrl são obrigatórios' });
    }
    try {
      const link = await prisma.link.upsert({
        where: { slug },
        update: { iosUrl, androidUrl, desktopUrl },
        create: { slug, iosUrl, androidUrl, desktopUrl }
      });
      res.json(link);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Falha ao salvar link' });
    }
  });

  app.get('/admin/links', async (_req, res) => {
    const links = await prisma.link.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(links);
  });

  app.get('/admin/links/:slug/clicks', async (req, res) => {
    const link = await prisma.link.findUnique({ where: { slug: req.params.slug } });
    if (!link) return res.status(404).json({ error: 'Link não encontrado' });
    const clicks = await prisma.click.findMany({
      where: { linkId: link.id },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(clicks);
  });

    app.get('/qr/:slug.png', async (req, res) => {
    const { slug } = req.params;
    const link = await prisma.link.findUnique({ where: { slug } });
    if (!link || !link.isActive) return res.status(404).send('Link não encontrado');

    const base = process.env.BASE_URL?.replace(/\/+$/, '') || `http://localhost:${process.env.PORT||3000}`;
    const smartUrl = `${base}/l/${encodeURIComponent(slug)}`;

    try {
      const png = await QRCode.toBuffer(smartUrl, { type: 'png', margin: 1, width: 600 });
      res.set('Content-Type', 'image/png');
      res.send(png);
    } catch (e) {
      console.error(e);
      res.status(500).send('Falha ao gerar QR');
    }
  });

    // Criar smart link via tela (JSON ou form-url-encoded)
  app.post('/api/links', expressJsonGuard, async (req, res) => {
    let { slug, iosUrl, androidUrl, desktopUrl } = req.body || {};

    // validações básicas
    if (!iosUrl || !androidUrl) {
      return res.status(400).json({ error: 'iosUrl e androidUrl são obrigatórios' });
    }
    if (!isValidUrl(iosUrl) || !isValidUrl(androidUrl)) {
      return res.status(400).json({ error: 'URLs inválidas' });
    }
    if (desktopUrl && !isValidUrl(desktopUrl)) {
      return res.status(400).json({ error: 'desktopUrl inválida' });
    }

    // slug automático se não informado
    if (!slug) {
      // tenta gerar um disponível
      for (let i=0;i<5;i++){
        const s = slugifyCandidate();
        const exists = await prisma.link.findUnique({ where: { slug: s } });
        if (!exists) { slug = s; break; }
      }
      if (!slug) return res.status(500).json({ error: 'Falha ao gerar slug' });
    }

    try {
      const link = await prisma.link.upsert({
        where: { slug },
        update: { iosUrl, androidUrl, desktopUrl },
        create: { slug, iosUrl, androidUrl, desktopUrl }
      });

        const absBase = process.env.BASE_URL?.replace(/\/+$/, '') || `http://localhost:${process.env.PORT||3000}`;
        const smartUrl = `${absBase}/l/${encodeURIComponent(link.slug)}`; // absoluto (vai no QR do celular)
        const qrPng = `/qr/${encodeURIComponent(link.slug)}.png`;         // relativo (carrega no navegador)

        return res.json({ slug: link.slug, smartUrl, qrPng });

    } catch (e) {
      if (String(e?.message||'').includes('Unique constraint') || String(e?.code)==='P2002') {
        return res.status(409).json({ error: 'Slug já existe. Tente outro.' });
      }
      console.error(e);
      return res.status(500).json({ error: 'Erro ao salvar link' });
    }
  });

  // Página visual para criar links (form)
  app.get('/create', (_req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'create.html'));
  });

}

function expressJsonGuard(req, res, next) {
  if (req.is('application/json')) return next();
  // permite também x-www-form-urlencoded
  if (req.is('application/x-www-form-urlencoded')) return next();
  next();
}

function slugifyCandidate() {
  // slug curto aleatório: 5 letras/números (ex: k9p3x)
  return Math.random().toString(36).slice(2, 7);
}
function isValidUrl(u='') {
  try { new URL(u); return true; } catch { return false; }
}
