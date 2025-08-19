import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, CreditCard, Building } from 'lucide-react';
import { twJoin } from 'tailwind-merge';

interface Extractor {
  name: string;
  displayName: string;
}

interface ExtractorSelectionStepProps {
  extractors: Extractor[];
  selectedExtractor: string;
  onExtractorSelect: (extractor: string) => void;
}

export default function ExtractorSelectionStep({
  extractors,
  selectedExtractor,
  onExtractorSelect
}: ExtractorSelectionStepProps) {
  const { t } = useTranslation();

  const getExtractorIcon = (extractorName: string) => {
    if (extractorName.toLowerCase().includes('cc') || extractorName.toLowerCase().includes('credit')) {
      return <CreditCard className="w-5 h-5" />;
    }
    if (extractorName.toLowerCase().includes('extrato') || extractorName.toLowerCase().includes('statement')) {
      return <Building className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const getExtractorDescription = (extractorName: string) => {
    const name = extractorName.toLowerCase();
    if (name.includes('nubank')) {
      if (name.includes('cc')) {
        return t('importTransactions.extractorDesc.nubankCC', 'Nubank credit card statements');
      }
      return t('importTransactions.extractorDesc.nubankExtrato', 'Nubank account statements');
    }
    if (name.includes('caixa')) {
      if (name.includes('cc')) {
        return t('importTransactions.extractorDesc.caixaCC', 'Caixa credit card statements');
      }
      return t('importTransactions.extractorDesc.caixaExtrato', 'Caixa account statements');
    }
    return t('importTransactions.extractorDesc.generic', 'Financial document extractor');
  };

  if (extractors.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {t('importTransactions.noExtractors', 'No extractors available')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {extractors.map(extractor => {
          const isSelected = selectedExtractor === extractor.name;
          return (
            <Button
              key={extractor.name}
              variant={isSelected ? "default" : "outline"}
              className="w-full justify-start h-auto p-4 text-left"
              onClick={() => onExtractorSelect(extractor.name)}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className="flex-shrink-0 mt-0.5">
                  {getExtractorIcon(extractor.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{extractor.displayName}</div>
                  <div className={twJoin("text-xs mt-1", !isSelected ? 'text-muted-foreground' : '')}>
                    {getExtractorDescription(extractor.name)}
                  </div>
                </div>
              </div>
            </Button>
          )
        })}
      </div>

      {selectedExtractor && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            ✓ {t('importTransactions.extractorSelected', 'Extractor selected')}: {' '}
            <span className="font-medium">
              {extractors.find(ext => ext.name === selectedExtractor)?.displayName}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
