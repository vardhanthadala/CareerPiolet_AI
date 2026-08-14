/**
 * Normalized job format — all connectors must return jobs in this shape.
 * The rest of the system (AI, frontend, matching) only sees this format.
 */
export interface NormalizedJob {
  source: string;
  externalId: string;
  title: string;
  company: string; // Company ATS identifier
  location?: string;
  workplaceType?: 'ONSITE' | 'REMOTE' | 'HYBRID';
  description: string;
  descriptionPlain?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobUrl?: string;
  applicationUrl?: string;
  department?: string;
  team?: string;
  commitment?: string;
  postedAt?: Date;
}

/**
 * Interface that every job connector must implement.
 */
export interface IJobConnector {
  /** Connector source name (e.g., "greenhouse", "lever", "ashby") */
  readonly source: string;

  /** Fetch all published jobs for a given company identifier */
  fetchJobs(identifier: string): Promise<NormalizedJob[]>;
}
