export interface FlowSession {
  id: string;
  start: string;
  end?: string;
  objective: string;
  self_score?: number;
}