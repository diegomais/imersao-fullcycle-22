package events

type TransactionPending struct {
	AccountID string  `json:"account_id"`
	Amount    float64 `json:"amount"`
	InvoiceID string  `json:"invoice_id"`
}

func NewTransactionPending(accountID, invoiceID string, amount float64) *TransactionPending {
	return &TransactionPending{
		AccountID: accountID,
		Amount:    amount,
		InvoiceID: invoiceID,
	}
}
