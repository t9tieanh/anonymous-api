import CONNECT_DB from './mongodb'
import RabbitClient from './rabbitmq'
// Start consumers
import '~/consumers/file.consumer'

export const CONNECT_DATABASES = async (): Promise<void> => {
  try {
    await Promise.all([
      CONNECT_DB()
        .then(() => console.log('Connected MongoDB'))
        .catch((error) => {
          console.error('MongoDB connection error:', error)
        }),
      // Redis.CONNECT_REDIS_DB().then(() => console.log('Connected Redis')),
      // ensure rabbitmq client created (consumers will register on import)
      RabbitClient.getInstance()
        .then(() => console.log('Connected RabbitMQ'))
        .catch((error) => console.log('RabbitMQ connect error', error))
    ])
  } catch (err) {
    console.error('Database connection failed:', err)
  }
}
