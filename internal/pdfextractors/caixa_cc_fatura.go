package pdfextractors

import (
	"fmt"
	"strings"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/ledongthuc/pdf"
)

type caixaCCFaturaExtractor struct{}

func NewCaixaCCFaturaExtractor() *caixaCCFaturaExtractor {
	return &caixaCCFaturaExtractor{}
}

func (s *caixaCCFaturaExtractor) Name() string {
	return "Caixa - Cartão de Crédito Fatura"
}

func (s *caixaCCFaturaExtractor) ExtractText(filePath string) (string, error) {
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

func (e *caixaCCFaturaExtractor) Extract(filePath string, accountID uint) ([]models.Transaction, error) {
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

func (e *caixaCCFaturaExtractor) ExtractTransactions(text string, accountID uint) ([]models.Transaction, error) {
	fields := e.splitLines(text)

	var lines []string
	columnsPerRow := 5
	for i := 0; i+columnsPerRow-1 < len(fields); {
		row := fields[i : i+columnsPerRow]
		// Skip header or summary rows
		if !e.isTransactionRow(row) {
		}

		lines = append(lines, strings.Join(row, " | "))
		i += columnsPerRow
	}

	return []models.Transaction{}, nil
}

func (e *caixaCCFaturaExtractor) isTransactionRow(row []string) bool {
	return false
}

func (e *caixaCCFaturaExtractor) splitLines(s string) []string {
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
