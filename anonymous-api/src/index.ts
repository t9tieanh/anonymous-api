import express from 'express'
import cors from 'cors'
import 'reflect-metadata'
import { CONNECT_DATABASES } from './config/connect'
import { env } from '~/config/env'
import { errorHandlingMiddleware } from '~/middleware/error-handler.midleware'
import http from 'http'
import debugRoutes from './routes/debug/debug.routes'
import router from '~/routes/index'
// import router from './routes/summarizeRoute'
// import router from './routes/summarize.route'
import ai_router from './routes/summarize.route'
import fileRoutes from './routes/file.route'

const START_SERVER = async () => {
  const app = express()

  app.use(express.json())

  // CORS configuration
  const corsOptions: cors.CorsOptions = {
    origin: env.FRONTEND_ORIGIN || (env.BUILD_MODE === 'dev' ? true : undefined),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }

  app.use(cors(corsOptions))

  app.use('/hackathon', router)
  app.use(errorHandlingMiddleware)

  // tạo server duy nhất
  const server = http.createServer(app)

  // start listen
  const hostname = env.APP_HOST
  const port = Number(env.APP_PORT)

  server.listen(port, hostname, () => {
    console.log(`Server đang chạy trên: ${hostname}:${port}/`)
  })
}

CONNECT_DATABASES()
  .then(() => console.log('Database connected successfully'))
  .then(() => START_SERVER())
  .catch((err) => {
    console.error('Database connection failed:', err)
    process.exit(1)
  })
