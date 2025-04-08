package domain

type AccountRepository interface {
	FindByAPIKey(apiKey string) (*Account, error)
	FindByID(id string) (*Account, error)
	Save(account *Account) error
	UpdateBalance(account *Account) error
}

type InvoiceRepository interface {
	FindByAccountID(accountID string) ([]*Invoice, error)
	FindByID(id string) (*Invoice, error)
	Save(invoice *Invoice) error
	UpdateStatus(invoice *Invoice) error
}
