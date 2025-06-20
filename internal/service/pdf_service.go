package service

import (
	"fmt"
	"strings"

	"github.com/ledongthuc/pdf"
)

type PDFService interface {
	ExtractText(filePath string) (string, error)
	ExtractTransactions(filePath string) ([]string, error)
}

type pdfService struct{}

func NewPDFService() PDFService {
	return &pdfService{}
}

func (s *pdfService) ExtractText(filePath string) (string, error) {
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

func (s *pdfService) ExtractTransactions(filePath string) ([]string, error) {
	text, err := s.ExtractText(filePath)
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
	return lines, nil
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

func trim(s string) string {
	return strings.TrimSpace(s)
}
