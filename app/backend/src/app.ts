import fs from 'node:fs';
import path from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { config } from './config';
import { prisma } from './lib/prisma';
import { AppError } from './lib/http-error';
import { authRoutes } from './routes/auth';
import { habitsRoutes } from './routes/habits';
import { homeRoutes } from './routes/home';
import { sleepRoutes } from './routes/sleep';

interface SessionPayload {
  userId: string;
  telegramId: string;
}

const FRONTEND_DIST_DIR = path.resolve(process.cwd(), '../frontend/dist');
const FRONTEND_INDEX_PATH = path.join(FRONTEND_DIST_DIR, 'index.html');
const FRONTEND_ASSETS_DIR = path.join(FRONTEND_DIST_DIR, 'assets');

function getContentType(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.ico':
      return 'image/x-icon';
    case '.map':
      return 'application/json; charset=utf-8';
    case '.txt':
      return 'text/plain; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

function resolveSafePath(baseDir: string, relativePath: string): string | null {
  const resolvedPath = path.resolve(baseDir, relativePath);
  const normalizedBaseDir = path.resolve(baseDir) + path.sep;

  if (resolvedPath === path.resolve(baseDir) || resolvedPath.startsWith(normalizedBaseDir)) {
    return resolvedPath;
  }

  return null;
}

function sendStaticFile(reply: { code: (code: number) => { send: (payload: unknown) => void }; type: (value: string) => void; header: (name: string, value: string) => void; send: (payload: unknown) => unknown }, filePath: string, immutable = false) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    reply.code(404).send({
      message: 'Not found'
    });
    return;
  }

  reply.type(getContentType(filePath));
  reply.header('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
  reply.send(fs.createReadStream(filePath));
}

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  void app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, origin === config.FRONTEND_ORIGIN);
    },
    credentials: true
  });

  void app.register(helmet, {
    contentSecurityPolicy: false
  });

  void app.register(jwt, {
    secret: config.JWT_SECRET
  });

  app.decorate('authenticate', async (request) => {
    const payload = await request.jwtVerify<SessionPayload>();
    request.authUser = {
      userId: payload.userId,
      telegramId: payload.telegramId
    };
  });

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  app.get('/health', () => ({
    status: 'ok'
  }));

  void app.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(homeRoutes);
      await api.register(habitsRoutes);
      await api.register(sleepRoutes);
    },
    {
      prefix: config.API_PREFIX
    }
  );

  if (fs.existsSync(FRONTEND_INDEX_PATH)) {
    app.get('/assets/*', async (request, reply) => {
      const params = request.params as { '*': string };
      const assetPath = resolveSafePath(FRONTEND_ASSETS_DIR, params['*']);

      if (!assetPath) {
        reply.code(404).send({
          message: 'Asset not found'
        });
        return;
      }

      sendStaticFile(reply, assetPath, true);
    });

    app.get('/', async (_request, reply) => {
      sendStaticFile(reply, FRONTEND_INDEX_PATH);
    });

    app.get('/index.html', async (_request, reply) => {
      sendStaticFile(reply, FRONTEND_INDEX_PATH);
    });

    app.get('/*', async (request, reply) => {
      const requestPath = (request.raw.url ?? '/').split('?')[0];

      if (requestPath === '/health' || requestPath.startsWith(config.API_PREFIX)) {
        void reply.callNotFound();
        return;
      }

      const relativePath = requestPath.replace(/^\/+/, '');
      const candidatePath = relativePath ? resolveSafePath(FRONTEND_DIST_DIR, relativePath) : null;

      if (candidatePath && fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
        sendStaticFile(reply, candidatePath, candidatePath.includes(`${path.sep}assets${path.sep}`));
        return;
      }

      sendStaticFile(reply, FRONTEND_INDEX_PATH);
    });
  } else {
    app.log.warn(`Frontend dist not found at ${FRONTEND_INDEX_PATH}. Only API routes will be available.`);
  }

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof ZodError) {
      reply.code(400).send({
        message: 'Validation error',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      reply.code(404).send({
        message: 'Record not found'
      });
      return;
    }

    if (error instanceof AppError) {
      reply.code(error.statusCode).send({
        message: error.message
      });
      return;
    }

    const statusCode =
      typeof (error as { statusCode?: number }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;
    const fallbackMessage = error instanceof Error ? error.message : 'Request failed';

    reply.code(statusCode).send({
      message: statusCode >= 500 ? 'Internal server error' : fallbackMessage
    });
  });

  return app;
}
