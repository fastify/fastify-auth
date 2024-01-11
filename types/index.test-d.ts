import fastify, { FastifyInstance, FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import fastifyAuth from '..'
import { expectType } from 'tsd';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'

const app = fastify();

type Done = (error?: Error) => void

app.register(fastifyAuth).after((err) => {
  app.auth([
    (request, reply, done) => {
			expectType<FastifyRequest>(request)
			expectType<FastifyReply>(reply)
			expectType<Done>(done)
    },
  ], {relation: 'or'});
  app.auth([
    (request, reply, done) => {
			expectType<FastifyRequest>(request)
			expectType<FastifyReply>(reply)
			expectType<Done>(done)
    },
  ], {run: 'all'});
  app.auth([
    (request, reply, done) => {
			expectType<FastifyRequest>(request)
			expectType<FastifyReply>(reply)
			expectType<Done>(done)
    },
  ]);
  app.auth([
    function (request, reply, done) {
      expectType<FastifyInstance>(this)
    },
  ]);
  const auth = app.auth([(request, reply, done) => {}]);
  expectType<preHandlerHookHandler>(auth);
  app.get('/secret', {preHandler: auth}, (request, reply) => {});
  app.get('/private', {preHandler: [auth]}, (request, reply) => {});
});

const typebox = fastify().withTypeProvider<TypeBoxTypeProvider>()
typebox.register(fastifyAuth)
typebox.route({
  method: 'GET',
  url: '/',
  preHandler: typebox.auth([]),
  handler: () => {}
})

const jsonSchemaToTS = fastify().withTypeProvider<JsonSchemaToTsProvider>()
jsonSchemaToTS.register(fastifyAuth)
jsonSchemaToTS.route({
  method: 'GET',
  url: '/',
  preHandler: jsonSchemaToTS.auth([]),
  handler: () => {}
})

declare module "fastify" {
  interface FastifyRequest {
    identity: {actorId: string};
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export const usersMutationAccessPolicy =
  (fastify: FastifyInstance) =>
    async (
      request: FastifyRequest<{
        Params: { userId: string }
      }>,
    ): Promise<void> => {
      const { actorId } = request.identity;
      const isOwner = actorId === request.params.userId;

      if (isOwner) {
        return;
      }

      fastify.log.warn("Actor should not be able to see this route");

      throw new Error(request.params.userId);
    };

async function usersController(fastify: FastifyInstance): Promise<void> {
  fastify.patch<{
    Params: { userId: string };
    Body: { name: string };
  }>(
    "/:userId",
    {
      onRequest: fastify.auth([
        usersMutationAccessPolicy(fastify),
      ]),
    },
    async (req, res) => ({ success: true }),
  );
}

async function usersControllerV2(fastify: FastifyInstance): Promise<void> {
  fastify.patch<{
    Params: { userId: string };
    Body: { name: string };
  }>(
    "/:userId",
    {
      onRequest: usersMutationAccessPolicy(fastify),
    },
    async (req, res) => ({ success: true }),
  );
}