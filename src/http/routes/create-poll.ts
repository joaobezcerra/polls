import { z } from "zod"
import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"

export async function createPoll(app: FastifyInstance) {

    app.post('/polls', async (request, reply) => {
        const CreatePollBody = z.object({
            title: z.string(),
        options: z.array(z.string()),
        })

        const { title, options } = CreatePollBody.parse(request.body)

        const poll = await prisma.poll.create({
            data: {
                title,
                options: {
                    createMany: {
                        data: options.map(option => {
                            return { title: option }
                        }),
                    }
                },
            }
        })

        await prisma.pollOption.createMany({
            data: options.map(option => {
                return { title: option, pollId: poll.id }
            }),
        })

        return reply.status(201).send({ pollId: poll.id })
    })
}