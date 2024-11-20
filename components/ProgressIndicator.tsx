import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  operation: string;
  fileName: string;
  progress: number;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

export function ProgressIndicator({
  operation,
  fileName,
  progress,
  status,
  error,
}: ProgressIndicatorProps) {
  const { toast } = useToast();
  const [showProgress, setShowProgress] = useState(true);

  useEffect(() => {
    if (status === 'completed') {
      toast({
        title: 'Operation Complete',
        description: `Successfully ${operation} ${fileName}`,
      });
      const timer = setTimeout(() => setShowProgress(false), 3000);
      return () => clearTimeout(timer);
    }

    if (status === 'error') {
      toast({
        title: 'Operation Failed',
        description: error || `Failed to ${operation} ${fileName}`,
        variant: 'destructive',
      });
    }
  }, [status, operation, fileName, error, toast]);

  if (!showProgress) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-card rounded-lg shadow-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{fileName}</div>
        {status === 'processing' && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">
          {status === 'processing'
            ? `${operation}... ${Math.round(progress)}%`
            : status === 'completed'
            ? 'Completed'
            : 'Error'}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

// Progress Manager Hook
export function useProgressManager() {
  const [operations, setOperations] = useState<
    Record<string, ProgressIndicatorProps>
  >({});

  const startOperation = (
    id: string,
    operation: string,
    fileName: string
  ) => {
    setOperations((prev) => ({
      ...prev,
      [id]: {
        operation,
        fileName,
        progress: 0,
        status: 'processing',
      },
    }));
  };

  const updateProgress = (id: string, progress: number) => {
    setOperations((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        progress,
      },
    }));
  };

  const completeOperation = (id: string) => {
    setOperations((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        progress: 100,
        status: 'completed',
      },
    }));
  };

  const failOperation = (id: string, error: string) => {
    setOperations((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: 'error',
        error,
      },
    }));
  };

  return {
    operations,
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
  };
}

// Progress Indicators Container
export function ProgressIndicators() {
  const { operations } = useProgressManager();

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {Object.entries(operations).map(([id, props]) => (
        <ProgressIndicator key={id} {...props} />
      ))}
    </div>
  );
}
