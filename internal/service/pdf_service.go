package service

import (
	"fmt"
	"os"

	"strings"

	"github.com/unidoc/unipdf/v3/extractor"
	"github.com/unidoc/unipdf/v3/model"
)

type PDFService interface {
	ExtractText(filePath string) (string, error)
}

type pdfService struct{}

func NewPDFService() PDFService {
	return &pdfService{}
}

func (s *pdfService) ExtractText(filePath string) (string, error) {
	// Open the PDF file
	f, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open PDF file: %v", err)
	}
	defer f.Close()

	// Create a PDF reader
	pdfReader, err := model.NewPdfReader(f)
	if err != nil {
		return "", fmt.Errorf("failed to create PDF reader: %v", err)
	}

	// Get the number of pages
	numPages, err := pdfReader.GetNumPages()
	if err != nil {
		return "", fmt.Errorf("failed to get number of pages: %v", err)
	}

	// Extract text from all pages
	var textBuilder strings.Builder
	for i := 1; i <= numPages; i++ {
		// Get the page
		page, err := pdfReader.GetPage(i)
		if err != nil {
			return "", fmt.Errorf("failed to get page %d: %v", i, err)
		}

		// Create an extractor for the page
		ex, err := extractor.New(page)
		if err != nil {
			return "", fmt.Errorf("failed to create extractor for page %d: %v", i, err)
		}

		// Extract the text
		pageText, _, _, err := ex.ExtractPageText()
		if err != nil {
			return "", fmt.Errorf("failed to extract text from page %d: %v", i, err)
		}

		// Add the text to our result
		textBuilder.WriteString(pageText.Text())
		textBuilder.WriteString("\n")
	}

	return textBuilder.String(), nil
}
