import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { registerRoutes } from './routes.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', true);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "https://cdn.tailwindcss.com"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
      "form-action": ["'self'"],
      "upgrade-insecure-requests": null,
      "block-all-mixed-content": null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.set('trust proxy', true);
app.use((req, res, next) => {
  if (req.secure) return res.redirect(`http://${req.headers.host}${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

// arquivos estáticos
app.use('/static', express.static(path.join(__dirname, 'public')));

// páginas (fallback / desktop)
app.use('/views', express.static(path.join(__dirname, 'views')));

registerRoutes(app);

app.get('/', (_req, res) => res.send('OK – Smart Link rodando'));

app.set('trust proxy', true);
app.use((req, res, next) => {
  if (req.secure) {
    return res.redirect(`http://${req.headers.host}${req.url}`);
  }
  next();
});

app.listen(PORT, () => console.log(`http://0.0.0.0:${PORT}`));

