export interface DataStreamWriter {
  write: (data: any) => void;
  end: () => void;
  error: (error: Error) => void;
}

export type DataStreamWriterProps = {
  write: DataStreamWriter['write'];
  end: DataStreamWriter['end'];
  error: DataStreamWriter['error'];
}; 