export type DataRow = Record<string, any>;

export interface UploadedFile {
  name: string;
  data: DataRow[];
  headers: string[];
}

export type FilterConfig = {
  column: string;
  value: string;
};
