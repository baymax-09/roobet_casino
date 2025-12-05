import { type FilterQuery, Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { getRaffles } from './raffle'

export interface RaffleTicket {
  _id: string
  userId: string
  raffleId: Types.ObjectId
  tickets: number
}

const RaffleTicketSchema = new mongoose.Schema<RaffleTicket>(
  {
    userId: { type: String, index: true },
    raffleId: { type: mongoose.Schema.Types.ObjectId, index: true },
    tickets: { type: Number, index: true },
  },
  { timestamps: true },
)

export const RaffleTicketModel = mongoose.model<RaffleTicket>(
  'raffle_ticket_v2',
  RaffleTicketSchema,
)

export const getTickets = (raffleId: Types.ObjectId, userId: string) => {
  return RaffleTicketModel.findOne({ raffleId, userId }).lean()
}

export const getTicketCount = async (
  raffleId: Types.ObjectId,
  filter?: FilterQuery<RaffleTicket>,
) => {
  const totalTicketCount = await RaffleTicketModel.countDocuments({
    raffleId,
    ...filter,
  })

  return totalTicketCount
}

export const getTicketsForUser = async (userId: string) => {
  const raffles = await getRaffles()
  const result = await RaffleTicketModel.aggregate([
    {
      $match: {
        userId,
      },
    },
    {
      $lookup: {
        from: 'raffle_v2',
        let: {
          raffleId: {
            $toObjectId: '$raffleId',
          },
        },
        as: 'raffle',
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$raffleId'],
              },
            },
          },
        ],
      },
    },
    {
      $match: {
        'raffle.archived': {
          $ne: true,
        },
      },
    },
  ])

  const populatedTickets = result.map(doc => new RaffleTicketModel(doc))

  return raffles.map(({ name, _id }) => {
    const populatedTicket = populatedTickets.find(({ raffleId }) => {
      const raffleObjectId = new Types.ObjectId(raffleId)
      const ticketObjectId = new Types.ObjectId(_id)
      return raffleObjectId.equals(ticketObjectId)
    })

    const tickets = Math.floor(populatedTicket?.tickets || 0)

    return { name, raffleId: _id.toString(), tickets }
  })
}

export async function getUniqueTicketsForRaffleById(
  raffleId: Types.ObjectId,
  blocklist: string[] = [],
): Promise<number> {
  const result = await RaffleTicketModel.aggregate([
    {
      $match: {
        raffleId,
        userId: { $nin: [...blocklist] },
      },
    },
    {
      $group: {
        _id: '$userId',
        totalTickets: {
          $sum: '$tickets',
        },
      },
    },
    {
      $group: {
        _id: null,
        totalTickets: {
          $sum: 1,
        },
      },
    },
  ])

  return Math.floor(result?.[0]?.totalTickets ?? 0)
}

export async function getTotalTicketsForRaffleById(
  raffleId: Types.ObjectId,
): Promise<number> {
  const result = await RaffleTicketModel.aggregate([
    { $match: { raffleId } },
    {
      $group: {
        _id: null,
        totalTickets: {
          $sum: '$tickets',
        },
      },
    },
  ])

  return Math.floor(result?.[0]?.totalTickets ?? 0)
}

/**
 *
 * @param raffleId | raffle id
 * @param userId | user id
 * @param amount | number of tickets
 * @returns {Promise<RaffleTicket>}
 */
export async function addTickets(
  raffleId: Types.ObjectId | string,
  userId: string,
  amount: number,
) {
  const result = await RaffleTicketModel.findOneAndUpdate(
    { raffleId, userId },
    {
      $inc: {
        tickets: amount,
      },
    },
    { upsert: true, new: true },
  ).lean()

  return {
    ...result,
    tickets: Math.floor(result.tickets ?? 0),
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: 'raffle_ticket_v2',
}
