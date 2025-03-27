import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { redis } from "./lib/redis"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: UpstashRedisAdapter(redis, { baseKeyPrefix: "auth:" }),
  // debug: true,
  providers: [Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET
  })],
  session: {
    strategy: "jwt",
  },

})