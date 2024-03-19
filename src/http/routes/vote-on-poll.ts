import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma'
import { redis } from "../../http/lib/redis";
import { FastifyInstance } from 'fastify';
import { voting } from '../utils/voting-pub-sub';

export async function VoteOnPoll(app: FastifyInstance) {

    app.post('/polls/:pollId/votes', async (request, reply) => {
        const VoteOnPollBody = z.object({
            pollOptionId: z.string().uuid()
        })

        const VoteOnPollParams = z.object({
            pollId: z.string().uuid()
        })

        const { pollId } = VoteOnPollParams.parse(request.params)
        const { pollOptionId } = VoteOnPollBody.parse(request.body)

        let { sessionId } = request.cookies

        if (sessionId) {
            const userPreviousVoteOnPoll = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId,
                    },
                }
            })

            if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId) {

                // Apagar o voto anterior
                // Criar um novo voto

                await prisma.vote.delete({
                    where: {
                        id: userPreviousVoteOnPoll.id,
                    }
                })

                const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)

                voting.publish(pollId, {
                    pollOptionId: userPreviousVoteOnPoll.pollOptionId,
                    votes: Number(votes),
                })
            } else if (userPreviousVoteOnPoll) {
                return reply.status(400).send({ message: 'You already voted on this poll!' })
            }
        }

        if (!sessionId) {
            sessionId = randomUUID()

            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                signed: true,
                httpOnly: true,
            })
        }

        await prisma.vote.create({
            data: {
                sessionId,
                pollId,
                pollOptionId,
            }
        })

        const votes = await redis.zincrby(pollId, 1, pollOptionId)

        voting.publish(pollId, {
            pollOptionId,
            votes: Number(votes),
        })

        return reply.status(201).send()
    })
}