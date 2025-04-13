package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/diegomais/imersao-fullcycle-22/go-gateway/internal/repository"
	"github.com/diegomais/imersao-fullcycle-22/go-gateway/internal/service"
	"github.com/diegomais/imersao-fullcycle-22/go-gateway/internal/web/server"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {

	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "user"),
		getEnv("DB_PASSWORD", "password"),
		getEnv("DB_NAME", "mydb"),
		getEnv("DB_SSL_MODE", "disable"),
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error connecting to database: ", err)
	}
	defer db.Close()

	baseKafkaConfig := service.NewKafkaConfig()

	producerTopic := getEnv("KAFKA_PRODUCER_TOPIC", "transactions_pending")
	producerConfig := baseKafkaConfig.WithTopic(producerTopic)
	kafkaProducer := service.NewKafkaProducer(producerConfig)
	defer kafkaProducer.Close()

	accountRepository := repository.NewAccountRepository(db)
	accountService := service.NewAccountService(accountRepository)

	invoiceRepository := repository.NewInvoiceRepository(db)
	invoiceService := service.NewInvoiceService(invoiceRepository, *accountService, kafkaProducer)

	consumerTopic := getEnv("KAFKA_CONSUMER_TOPIC", "transactions_result")
	consumerConfig := baseKafkaConfig.WithTopic(consumerTopic)
	groupID := getEnv("KAFKA_CONSUMER_GROUP_ID", "gateway-group")
	kafkaConsumer := service.NewKafkaConsumer(consumerConfig, groupID, invoiceService)
	defer kafkaConsumer.Close()

	go func() {
		if err := kafkaConsumer.Consume(context.Background()); err != nil {
			log.Printf("Error consuming kafka messages: %v", err)
		}
	}()

	port := getEnv("HTTP_PORT", "8080")
	srv := server.NewServer(accountService, invoiceService, port)
	srv.ConfigureRoutes()

	if err := srv.Start(); err != nil {
		log.Fatal("Error starting server: ", err)
	}
}
