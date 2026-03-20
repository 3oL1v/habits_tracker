import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    authUser: {
      userId: string;
      telegramId: string;
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}
