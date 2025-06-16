package pdfextractors_test

import (
	"testing"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/pdfextractors"
)

func TestNubankExtratoExtractor_ExtractTransactions(t *testing.T) {
	accountID := uint(42)
	fullTransactions := []models.Transaction{
		{
			Date:        mustParseDate("02/06/2025"),
			Amount:      2149.20,
			Type:        models.TransactionTypeIncome,
			Description: "Transferência recebida pelo Pix [CLIENT NAME]",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("02/06/2025"),
			Amount:      256.40,
			Type:        models.TransactionTypeExpense,
			Description: "Transferência enviada pelo Pix John Doe Company Ltda",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("02/06/2025"),
			Amount:      65.32,
			Type:        models.TransactionTypeExpense,
			Description: "Transferência enviada pelo Pix TELEFONICA BRASIL S A",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("02/06/2025"),
			Amount:      15.00,
			Type:        models.TransactionTypeExpense,
			Description: "Transferência enviada pelo Pix M4 PRODUTOS E SERVICOS LTDA",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("03/06/2025"),
			Amount:      360.00,
			Type:        models.TransactionTypeExpense,
			Description: "Transferência enviada pelo Pix Jane Smith Santos",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("05/06/2025"),
			Amount:      25.29,
			Type:        models.TransactionTypeExpense,
			Description: "Transferência enviada pelo Pix Maria Silva Costa",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("09/06/2025"),
			Amount:      40.00,
			Type:        models.TransactionTypeExpense,
			Description: "Pagamento de fatura",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("15/06/2025"),
			Amount:      100.00,
			Type:        models.TransactionTypeIncome,
			Description: "Reembolso recebido pelo Pix Carlos Oliveira Rosa",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("15/06/2025"),
			Amount:      100.00,
			Type:        models.TransactionTypeExpense,
			Description: "Transferência enviada pelo Pix Carlos Oliveira Rosa",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("18/06/2025"),
			Amount:      100.00,
			Type:        models.TransactionTypeExpense,
			Description: "Transferência enviada pelo Pix Pedro Santos Hillesheim",
			AccountID:   accountID,
		},
		{
			Date:        mustParseDate("19/06/2025"),
			Amount:      15.00,
			Type:        models.TransactionTypeExpense,
			Description: "Transferência enviada pelo Pix Ana Costa Prates",
			AccountID:   accountID,
		},
	}

	extractor := pdfextractors.NewNubankExtratoExtractor()

	tests := []struct {
		name     string
		text     string
		expected []models.Transaction
	}{
		{
			name:     "simulating real scenario with multiple transactions",
			text:     getExtractedText(t, "nubank_extrato_ok.txt"),
			expected: fullTransactions,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := extractor.ExtractTransactions(tt.text, accountID)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			assertTransactionsEqual(t, tt.expected, got)
		})
	}
}
