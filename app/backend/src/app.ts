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

