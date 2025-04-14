/* eslint-disable @typescript-eslint/no-unsafe-return */
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { BaseRpcContext } from '@nestjs/microservices';
import { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';

type ConfluentKafkaContextArgs = [
  message: KafkaMessage,
  partition: number,
  topic: string,
  consumer: KafkaJS.Consumer,
  heartbeat: () => Promise<void>,
  producer: KafkaJS.Producer,
];

export class ConfluentKafkaContext extends BaseRpcContext<ConfluentKafkaContextArgs> {
  constructor(args: ConfluentKafkaContextArgs) {
    super(args);
  }
  /**
   * Returns the reference to the original message.
   */
  getMessage(): KafkaMessage {
    return this.getArgByIndex(0);
  }
  /**
   * Returns the partition.
   */
  getPartition(): number {
    return this.getArgByIndex(1);
  }
  /**
   * Returns the name of the topic.
   */
  getTopic(): string {
    return this.getArgByIndex(2);
  }
  /**
   * Returns the Kafka consumer reference.
   */
  getConsumer(): KafkaJS.Consumer {
    return this.getArgByIndex(3);
  }
  /**
   * Returns the Kafka heartbeat callback.
   */
  getHeartbeat(): () => Promise<void> {
    return this.getArgByIndex(4);
  }
  /**
   * Returns the Kafka producer reference,
   */
  getProducer(): KafkaJS.Producer {
    return this.getArgByIndex(5);
  }
}
export {};
