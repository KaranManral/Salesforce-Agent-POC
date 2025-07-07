export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  type: string;
  postDate: string;
  responsibilities: string;
  skills: string;
  created_at: string;
  updated_at:string;
  salary_min?: number;
  salary_max?: number;
}


export interface Application {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  skills: string;
  education: string;
  experience: string;
  address: string;
  coverLetter: string;
  resume?: string;
  applied_at: string;
}

export interface CreateApplicationData {
  jobId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  postalCode: string;
  yearsExperience: number;
  phone: string;
  fax: string;
  ssn: string;
  street: string;
  city: string;
  stateProvince: string;
  country: string;
  currentEmployer: string;
  currentlyEmployed: boolean;
  usCitizen: boolean;
  visaRequired: boolean;
  education: string;
  skills: string;
  coverLetter: string;
  resume?: string;
}

export type Message = {
  type: "ai" | "user";
  message: string;
  aiStatus?: string;
  isTyping?: boolean;
};

export type TextChunk = {
  chunk: string;
  offset: number;
};

export type StreamingEvent = {
  type: string;
  message: {
    type: string;
    message: string;
  };
  offset: number;
};

export type SalesforceJobRecord = {
  Id: string;
  Name: string;
  Company_Name__r: { // This is a related object
    Name: string;
  };
  Location__c: string;
  Job_Description__c: string;
  Type__c: string;
  Open_Date__c: string; // Dates from JSON are typically strings
  Responsibilities__c: string;
  Skills_Required__c: string;
  Min_Pay__c: number | null; // Can be a number or null
  Max_Pay__c: number | null; // Can be a number or null
  CreatedDate: string;
}