package service

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"strings"

	"github.com/diegomais/imersao-fullcycle-22/go-gateway/internal/domain/events"
	"github.com/segmentio/kafka-go"
)

type KafkaProducerInterface interface {
	SendingPendingTransaction(ctx context.Context, event events.TransactionPending) error
	Close() error
}

type KafkaConsumerInterface interface {
	Consume(ctx context.Context) error
	Close() error
}

type KafkaConfig struct {
	Brokers []string
	Topic   string
}

func (c *KafkaConfig) WithTopic(topic string) *KafkaConfig {
	return &KafkaConfig{
		Brokers: c.Brokers,
		Topic:   topic,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func NewKafkaConfig() *KafkaConfig {
	broker := getEnv("KAFKA_BROKER", "localhost:9092")
	

	topic := getEnv("KAFKA_PRODUCER_TOPIC", "transactions_pending")

	return &KafkaConfig{
		Brokers: strings.Split(broker, ","),
		Topic:   topic,
	}
}

type KafkaProducer struct {
	writer  *kafka.Writer
	topic   string
	brokers []string
}

func NewKafkaProducer(config *KafkaConfig) *KafkaProducer {
	writer := &kafka.Writer{
		Addr:     kafka.TCP(config.Brokers...),
		Topic:    config.Topic,
		Balancer: &kafka.LeastBytes{},
	}

	slog.Info("kafka producer started", "brokers", config.Brokers, "topic", config.Topic)
	return &KafkaProducer{
		writer:  writer,
		topic:   config.Topic,
		brokers: config.Brokers,
	}
}

func (s *KafkaProducer) SendingPendingTransaction(ctx context.Context, event events.TransactionPending) error {
	value, err := json.Marshal(event)
	if err != nil {
		slog.Error("error converting event to json", "error", err)
		return err
	}

	msg := kafka.Message{
		Value: value,
	}

	slog.Info("sending message to kafka",
		"topic", s.topic,
		"message", string(value))

	if err := s.writer.WriteMessages(ctx, msg); err != nil {
		slog.Error("error sending message to kafka", "error", err)
		return err
	}

	slog.Info("message successfully sent to kafka", "topic", s.topic)
	return nil
}

func (s *KafkaProducer) Close() error {
	slog.Info("closing connection with kafka")
	return s.writer.Close()
}

type KafkaConsumer struct {
	reader         *kafka.Reader
	topic          string
	brokers        []string
	groupID        string
	invoiceService *InvoiceService
}

func NewKafkaConsumer(config *KafkaConfig, groupID string, invoiceService *InvoiceService) *KafkaConsumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: config.Brokers,
		Topic:   config.Topic,
		GroupID: groupID,
	})

	slog.Info("kafka consumer started",
		"brokers", config.Brokers,
		"topic", config.Topic,
		"group_id", groupID)

	return &KafkaConsumer{
		reader:         reader,
		topic:          config.Topic,
		brokers:        config.Brokers,
		groupID:        groupID,
		invoiceService: invoiceService,
	}
}

func (c *KafkaConsumer) Consume(ctx context.Context) error {
	for {
		msg, err := c.reader.ReadMessage(ctx)
		if err != nil {
			slog.Error("error reading message from kafka", "error", err)
			return err
		}

		var result events.TransactionResult
		if err := json.Unmarshal(msg.Value, &result); err != nil {
			slog.Error("error converting message to TransactionResult", "error", err)
			continue
		}

		slog.Info("message received from kafka",
			"topic", c.topic,
			"invoice_id", result.InvoiceID,
			"status", result.Status)

		if err := c.invoiceService.ProcessTransactionResult(result.InvoiceID, result.ToDomainStatus()); err != nil {
			slog.Error("error processing transaction result",
				"error", err,
				"invoice_id", result.InvoiceID,
				"status", result.Status)
			continue
		}

		slog.Info("transaction processed successfully",
			"invoice_id", result.InvoiceID,
			"status", result.Status)
	}
}

func (c *KafkaConsumer) Close() error {
	slog.Info("closing connection with kafka consumer")
	return c.reader.Close()
}
