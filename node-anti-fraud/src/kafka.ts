import { NestFactory } from '@nestjs/core';
import { KAFKA_DEFAULT_BROKER } from '@nestjs/microservices/constants';
import { AppModule } from './app.module';
import { ConfluentKafkaServer } from './kafka/confluent-kafka-server';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    strategy: new ConfluentKafkaServer({
      server: {
        'bootstrap.servers':
          process.env.KAFKA_BOOTSTRAP_SERVER ?? KAFKA_DEFAULT_BROKER,
      },
      consumer: {
        allowAutoTopicCreation: true,
        rebalanceTimeout: 10_000,
        sessionTimeout: 10_000,
      },
    }),
  });
  await app.listen();
}
bootstrap();
