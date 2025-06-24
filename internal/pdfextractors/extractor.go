package pdfextractors

import "github.com/LeonardsonCC/dinheiros/internal/models"

type PDFExtractor interface {
	Extract(filePath string, accountID uint) ([]models.Transaction, error)
	ExtractText(filePath string) (string, error)
	ExtractTransactions(text string, accountID uint) ([]models.Transaction, error)
}

func GetExtractorByName(name string) PDFExtractor {
	switch name {
	case "caixa":
		return NewCaixaExtratoExtractor()
	default:
		return nil
	}
}
