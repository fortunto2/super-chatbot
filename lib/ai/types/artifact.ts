

export interface ArtifactMetadata {
  [key: string]: any;
}

export interface ArtifactProps {
  title: string;
  content: string;
  mode: 'edit' | 'diff';
  status: 'streaming' | 'idle';
  currentVersionIndex: number;
  suggestions: any[];
  onSaveContent: (content: string, debounce?: boolean) => void;
  isInline: boolean;
  isCurrentVersion: boolean;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata?: ArtifactMetadata;
  setMetadata?: (metadata: ArtifactMetadata) => void;
  chatId?: string;
}

export interface ArtifactDefinition {
  kind: string;
  description: string;
  content: React.ComponentType<ArtifactProps>;
  initialize?: (props: { documentId: string; setMetadata: (metadata: ArtifactMetadata) => void }) => Promise<void>;
  onStreamPart?: (props: {
    streamPart: { type: string; content: any };
    setArtifact: (artifact: any) => void;
    setMetadata: (metadata: ArtifactMetadata) => void;
  }) => void;
  actions?: Array<{
    icon: React.ReactNode;
    description: string;
    onClick: (props: any) => void;
    isDisabled?: (props: any) => boolean;
  }>;
} 