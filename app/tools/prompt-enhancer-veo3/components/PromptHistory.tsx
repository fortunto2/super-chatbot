import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2 } from "lucide-react";

interface PromptHistoryProps {
  promptHistory: any[];
  loadFromHistory: (item: any) => void;
  clearHistory: () => void;
  setActiveTab: (tab: string) => void;
}

export function PromptHistory({
  promptHistory,
  loadFromHistory,
  clearHistory,
  setActiveTab,
}: PromptHistoryProps) {
  return (
    <Card>
      {promptHistory.length > 0 ? (
        <>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Recent Prompts History
                <Badge variant="outline" className="ml-2">
                  {promptHistory.length}/10
                </Badge>
              </CardTitle>
              <Button
                onClick={clearHistory}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promptHistory.slice(0, 10).map((historyItem) => (
                <div key={historyItem.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs text-muted-foreground">
                      {historyItem.timestamp && typeof historyItem.timestamp === 'object' && 'toLocaleString' in historyItem.timestamp
                        ? historyItem.timestamp.toLocaleString()
                        : String(historyItem.timestamp)}
                    </p>
                    <div className="flex gap-1">
                      {historyItem.model && (
                        <Badge variant="outline" className="text-xs">
                          {historyItem.model}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {historyItem.length}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm mb-3 line-clamp-3">
                    {historyItem.basicPrompt && historyItem.basicPrompt.length > 120
                      ? historyItem.basicPrompt.substring(0, 120) + '...'
                      : historyItem.basicPrompt}
                  </p>
                  <Button
                    onClick={() => loadFromHistory(historyItem)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Load This Version
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </>
      ) : (
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Copy className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Generate and enhance prompts to see them here
          </p>
          <Button variant="outline" onClick={() => setActiveTab("builder")}>Start Building</Button>
        </CardContent>
      )}
    </Card>
  );
} 