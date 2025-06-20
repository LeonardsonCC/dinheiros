package pdfextractors

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/ledongthuc/pdf"
)

type caixaExtractor struct{}

func NewCaixaExtractor() *caixaExtractor {
	return &caixaExtractor{}
}

func (s *caixaExtractor) extractText(filePath string) (string, error) {
	file, reader, err := pdf.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open PDF file: %v", err)
	}
	defer file.Close()

	var textBuilder string
	for pageIndex := 1; pageIndex <= reader.NumPage(); pageIndex++ {
		page := reader.Page(pageIndex)
		if page.V.IsNull() {
			continue
		}
		content, err := page.GetPlainText(nil)
		if err != nil {
			return "", fmt.Errorf("failed to extract text from page %d: %v", pageIndex, err)
		}
		textBuilder += content
	}
	return textBuilder, nil
}

func (e *caixaExtractor) ExtractTransactions(filePath string, accountID uint) ([]models.Transaction, error) {
	text, err := e.extractText(filePath)
	if err != nil {
		return nil, err
	}

	fields := splitLines(text)
	var lines []string
	const columnsPerRow = 5
	for i := 0; i+columnsPerRow-1 < len(fields); i += columnsPerRow {
		row := fields[i : i+columnsPerRow]
		// Skip header or summary rows
		if row[0] == "Data Mov." || row[0] == "SALDO DIA" || row[0] == "SALDO ANTERIOR" {
			continue
		}
		lines = append(lines, strings.Join(row, " | "))
	}

	return parseTransactionsFromLines(lines, accountID)
}

// parseTransactionsFromLines parses transactions from the extracted lines
func parseTransactionsFromLines(lines []string, accountID uint) ([]models.Transaction, error) {
	var transactions []models.Transaction
	for _, line := range lines {
		fields := strings.Split(line, " | ")
		if len(fields) < 5 {
			continue // skip incomplete rows
		}
		dateStr := strings.TrimSpace(fields[0])
		description := strings.TrimSpace(fields[2])
		valor := strings.TrimSpace(fields[3])
		valorParts := strings.Fields(valor)
		if len(valorParts) < 2 {
			continue
		}
		amountStr := strings.ReplaceAll(valorParts[0], ".", "")
		amountStr = strings.ReplaceAll(amountStr, ",", ".")
		amount, err := strconv.ParseFloat(amountStr, 64)
		if err != nil {
			continue
		}
		if amount == 0 {
			continue // skip zero-amount transactions
		}
		var txType models.TransactionType = models.TransactionTypeExpense
		if strings.ToUpper(valorParts[1]) == "C" {
			txType = models.TransactionTypeIncome
		}
		date, err := time.Parse("02/01/2006", dateStr)
		if err != nil {
			date, err = time.Parse("02-01-2006", dateStr)
			if err != nil {
				continue
			}
		}
		transaction := models.Transaction{
			AccountID:   accountID,
			Amount:      amount,
			Type:        txType,
			Description: description,
			Date:        date,
		}
		transactions = append(transactions, transaction)
	}
	return transactions, nil
}

// Helper functions
func splitLines(s string) []string {
	// Split on newlines and tabs
	fields := strings.FieldsFunc(s, func(r rune) bool {
		return r == '\n' || r == '\r' || r == '\t'
	})
	var lines []string
	for _, f := range fields {
		trimmed := strings.TrimSpace(f)
		if trimmed != "" {
			lines = append(lines, trimmed)
		}
	}
	return lines
}
