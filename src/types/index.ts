export interface NotifyRequest {
  channel: string;
  to: string;
  template_id: string;
  priority?: 'realtime' | 'other';
  variables: any;
  dedupe_id?: string;
}

export interface Job {
  job_id: string;
  channel: string;
  priority: 'realtime' | 'other';
  to: string;
  template_id: string;
  variables: any;
}
