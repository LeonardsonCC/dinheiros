import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button, Card, CardContent } from './ui';
import { cn } from '../lib/utils';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  isValid: boolean;
}

interface ImportWizardProps {
  steps: WizardStep[];
  onBack?: () => void;
  backText?: string;
  summary?: {
    accountName?: string;
    extractorName?: string;
    fileName?: string;
    transactionCount?: number;
  };
}

export default function ImportWizard({ steps, onBack, backText, summary }: ImportWizardProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const goToNextStep = () => {
    if (currentStep < steps.length - 1 && steps[currentStep].isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    // Only allow going to completed steps or the next incomplete step
    const canGoToStep = stepIndex <= currentStep || 
      (stepIndex === currentStep + 1 && steps[currentStep].isValid);
    
    if (canGoToStep) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator with Labels */}
      <div className="space-y-4">
        {/* Progress stepper using grid for perfect alignment */}
        <div 
          className="grid gap-4 items-center"
          style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
        >
          {/* Step indicators row */}
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex items-center">
              {/* Step circle */}
              <div className="flex justify-center w-full">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors cursor-pointer bg-background relative z-10",
                    index < currentStep
                      ? "bg-primary text-primary-foreground border-primary"
                      : index === currentStep
                      ? "border-primary text-primary"
                      : "border-muted-foreground text-muted-foreground"
                  )}
                  onClick={() => goToStep(index)}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-px z-0 transition-colors",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                  style={{ transform: 'translateY(-1px)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels using same grid */}
        <div 
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
        >
          {steps.map((step, index) => (
            <div
              key={`${step.id}-label`}
              className={cn(
                "text-center text-sm transition-colors",
                index === currentStep
                  ? "text-foreground font-medium"
                  : index < currentStep
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Selection Summary - only show after first step */}
      {currentStep > 0 && summary && (
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('importTransactions.selectionSummary', 'Your Selections')}
              </h3>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {summary.accountName && (
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>{summary.accountName}</span>
                  </div>
                )}
                {summary.extractorName && currentStep > 1 && (
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>{summary.extractorName}</span>
                  </div>
                )}
                {summary.fileName && currentStep > 2 && (
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>{summary.fileName}</span>
                  </div>
                )}
                {summary.transactionCount !== undefined && summary.transactionCount > 0 && currentStep > 2 && (
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{summary.transactionCount} {t('importTransactions.transactions', 'transactions')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Step Content */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {steps[currentStep].description}
            </p>
          </div>
          
          {steps[currentStep].component}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep === 0 && onBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {backText || t('importTransactions.back')}
            </Button>
          ) : currentStep > 0 ? (
            <Button
              variant="outline"
              onClick={goToPreviousStep}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.previous', 'Previous')}
            </Button>
          ) : (
            <div />
          )}
        </div>

        <div>
          {currentStep < steps.length - 1 && (
            <Button
              onClick={goToNextStep}
              disabled={!steps[currentStep].isValid}
            >
              {t('common.next', 'Next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}