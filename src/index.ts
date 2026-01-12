import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import crypto from "crypto";
import { prisma } from "./prisma";

  // GraphQL Schema

const typeDefs = `#graphql
  type Poll {
    id: ID!
    title: String!
    isAnonymous: Boolean!
    createdAt: String!
    options: [Option!]!
    results: [OptionResult!]!
    totalVotes: Int!
  }

  type Option {
    id: ID!
    text: String!
  }

  type OptionResult {
    optionId: ID!
    text: String!
    votes: Int!
    percentage: Float!
  }

  type Query {
    polls: [Poll!]!
    poll(id: ID!): Poll
  }

  input CreatePollInput {
    title: String!
    isAnonymous: Boolean
    options: [String!]!
  }

  type Mutation {
    createPoll(input: CreatePollInput!): Poll!
    vote(pollId: ID!, optionId: ID!, isAnonymous: Boolean!): Boolean!
  }
`;

  // Utils

// Genere un hash unique a partir de lIP et du navigateur
function hashVoter(req: express.Request) {
  const ip = req.ip || "";
  const ua = req.headers["user-agent"] || "";
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}


   //Resolvers
    

const resolvers = {
  Query: {
    polls: async () =>
      prisma.poll.findMany({
        orderBy: { createdAt: "desc" },
        include: { options: true }
      }),

    poll: async (_: any, { id }: { id: string }) =>
      prisma.poll.findUnique({
        where: { id },
        include: { options: true }
      })
  },

  Poll: {
    createdAt: (p: any) => new Date(p.createdAt).toISOString(),

    totalVotes: (p: any) =>
      prisma.vote.count({ where: { pollId: p.id } }),

    results: async (p: any) => {
      const options = await prisma.option.findMany({
        where: { pollId: p.id }
      });

      const votes = await prisma.vote.findMany({
        where: { pollId: p.id }
      });

      const total = votes.length;
      const counts = new Map<string, number>();

      votes.forEach(v => {
        counts.set(v.optionId, (counts.get(v.optionId) || 0) + 1);
      });

      return options.map(o => {
        const v = counts.get(o.id) || 0;
        return {
          optionId: o.id,
          text: o.text,
          votes: v,
          percentage: total === 0 ? 0 : (v / total) * 100
        };
      });
    }
  },

  Mutation: {
    createPoll: async (_: any, { input }: any) => {
      if (input.options.length < 2) {
        throw new Error("Un sondage doit contenir au moins deux options");
      }

      return prisma.poll.create({
        data: {
          title: input.title,
          isAnonymous: input.isAnonymous ?? false,
          options: {
            create: input.options.map((text: string) => ({ text }))
          }
        },
        include: { options: true }
      });
    },

    vote: async (_: any, args: any, ctx: any) => {
      const voterHash = args.isAnonymous ? null : hashVoter(ctx.req);

      await prisma.vote.create({
        data: {
          pollId: args.pollId,
          optionId: args.optionId,
          isAnonymous: args.isAnonymous,
          voterHash
        }
      });

      return true;
    }
  }
};


   //Server setup
   

async function start() {
  const app = express();

  app.set("trust proxy", true);
  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs,
    resolvers
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ req })
    })
  );

  app.listen(4000, () => {
    console.log("GraphQL server running on http://localhost:4000/graphql");
  });
}

start();
