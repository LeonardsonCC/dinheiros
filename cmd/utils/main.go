package main

import (
	"log"
	"os"

	"github.com/LeonardsonCC/dinheiros/internal/pdfextractors"
)

func main() {
	if len(os.Args) < 4 {
		log.Fatalf("Usage: %s extract <extractor> <file_path>", os.Args[0])
	}

	operation := os.Args[1]
	if operation != "extract" {
		log.Fatalf("Unknown operation: %s. Supported operation is 'extract'.", operation)
		return
	}

	extractor := os.Args[2]
	filePath := os.Args[3]

	text, err := extractTextFromPDF(extractor, filePath)
	if err != nil {
		log.Fatalf("Error extracting text: %v", err)
	}

	log.Printf("Extracted text from %s using %s:\n%s", filePath, extractor, text)
}

func extractTextFromPDF(extractor string, filePath string) (string, error) {
	ex := pdfextractors.GetExtractorByName(extractor)
	text, err := ex.ExtractText(filePath)
	if err != nil {
		return "", err
	}
	return text, nil
}
