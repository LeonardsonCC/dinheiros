package pdfextractors

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/ledongthuc/pdf"
)

type caixaExtratoExtractor struct{}

func NewCaixaExtratoExtractor() *caixaExtratoExtractor {
	return &caixaExtratoExtractor{}
}

func (s *caixaExtratoExtractor) Name() string {
	return "Caixa - Extrato"
}

func (s *caixaExtratoExtractor) ExtractText(filePath string) (string, error) {
	file, reader, err := pdf.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open PDF file: %v", err)
	}
	defer func() {
		_ = file.Close()
	}()

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

func (e *caixaExtratoExtractor) Extract(filePath string, accountID uint) ([]models.Transaction, error) {
	text, err := e.ExtractText(filePath)
	if err != nil {
		return nil, err
	}

	transactions, err := e.ExtractTransactions(text, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to extract transactions: %v", err)
	}

	return transactions, nil
}

func (e *caixaExtratoExtractor) ExtractTransactions(text string, accountID uint) ([]models.Transaction, error) {
	fields := e.splitLines(text)

	var lines []string
	columnsPerRow := 5
	for i := 0; i+columnsPerRow-1 < len(fields); {
		row := fields[i : i+columnsPerRow]
		// Skip header or summary rows
		if !e.isTransactionRow(row) {
			i++
			continue
		}

		lines = append(lines, strings.Join(row, " | "))
		i += columnsPerRow
	}

	return e.parseTransactionsFromLines(lines, accountID)
}

func (e *caixaExtratoExtractor) isTransactionRow(row []string) bool {
	if len(row) < 5 {
		return false
	}
	if row[0] == "Data Mov." || row[0] == "SALDO DIA" || row[0] == "SALDO ANTERIOR" {
		return false
	}

	// transaction basic rules
	t, _ := time.Parse("02/01/2006", row[0])
	if t.IsZero() {
		return false
	}
	if row[3][len(row[3])-1] != 'C' && row[3][len(row[3])-1] != 'D' {
		return false
	}
	if row[4][len(row[4])-1] != 'C' && row[4][len(row[4])-1] != 'D' {
		return false
	}

	return true
}

// parseTransactionsFromLines parses transactions from the extracted lines
func (e *caixaExtratoExtractor) parseTransactionsFromLines(lines []string, accountID uint) ([]models.Transaction, error) {
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
		txType := models.TransactionTypeExpense
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

func (e *caixaExtratoExtractor) splitLines(s string) []string {
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
