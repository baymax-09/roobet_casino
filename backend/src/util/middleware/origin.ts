import corsMiddleware from 'cors'
import { type RequestHandler } from 'express'

import { config } from 'src/system/config'

// Spreading the allowed origins and headers to create mutable copies
const allowedOrigins = [...config.appSettings.allowedOrigins]
const allowedHeaders = [...config.appSettings.allowedHeaders]

export const originsMiddleware: RequestHandler = corsMiddleware({
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  origin: allowedOrigins,
  allowedHeaders,
  credentials: true,
})
