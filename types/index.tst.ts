import fastify, { FastifyInstance, FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import fastifyAuth from '..'
import { expect } from 'tstyche'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'

const app = fastify()

type Done = (error?: Error) => void

app.register(fastifyAuth).after((_err) => {
  app.auth([
    (request, reply, done) => {
      expect(request).type.toBe<FastifyRequest>()
      expect(reply).type.toBe<FastifyReply>()
      expect(done).type.toBe<Done>()
    },
  ], { relation: 'or' })
  app.auth([
    (request, reply, done) => {
      expect(request).type.toBe<FastifyRequest>()
      expect(reply).type.toBe<FastifyReply>()
      expect(done).type.toBe<Done>()
    },
  ], { run: 'all' })
  app.auth([
    (request, reply, done) => {
      expect(request).type.toBe<FastifyRequest>()
      expect(reply).type.toBe<FastifyReply>()
      expect(done).type.toBe<Done>()
    },
  ])
  app.auth([
    function () {
      expect(this).type.toBe<FastifyInstance>()
    },
  ])
  const auth = app.auth([() => {}])
  expect(auth).type.toBe<preHandlerHookHandler>()
  app.get('/secret', { preHandler: auth }, () => { })
  app.get('/private', { preHandler: [auth] }, () => {})
})

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

declare module 'fastify' {
  interface FastifyRequest {
    identity: { actorId: string };
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
      }>
    ): Promise<void> => {
      const { actorId } = request.identity
      const isOwner = actorId === request.params.userId

      if (isOwner) {
        return
      }

      fastify.log.warn('Actor should not be able to see this route')

      throw new Error(request.params.userId)
    }

async function usersController (fastify: FastifyInstance): Promise<void> {
  fastify.patch<{
    Params: { userId: string };
    Body: { name: string };
  }>(
    '/:userId',
    {
      onRequest: fastify.auth([
        usersMutationAccessPolicy(fastify),
      ]),
    },
    async () => ({ success: true })
  )
}
usersController(app)

async function usersControllerV2 (fastify: FastifyInstance): Promise<void> {
  fastify.patch<{
    Params: { userId: string };
    Body: { name: string };
  }>(
    '/:userId',
    {
      onRequest: usersMutationAccessPolicy(fastify),
    },
    async () => ({ success: true })
  )
}
usersControllerV2(app)
