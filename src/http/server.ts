import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { createPoll } from './routes/create-poll'
import { getPoll } from './routes/get-poll'
import { VoteOnPoll } from './routes/vote-on-poll'
import { fastifyWebsocket } from '@fastify/websocket'
import { pollResults } from './ws/poll-results'

const app = fastify()

// GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

app.register(cookie, {
    secret: "polls-app-nlw", // for cookies signature
    hook: 'onRequest', // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
})

app.register(fastifyWebsocket)

app.register(createPoll)
app.register(getPoll)
app.register(VoteOnPoll)

app.register(pollResults)

app.listen({ port: 3333 }).then(() => {
    console.log('HTTP server running!')
})

// ORMs - Bibliotecas que trazem uma interface para navegar no banco de dados com mais praticidade.

