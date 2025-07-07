// JobCard component displays a summary of a job posting in a card format.
// Shows job title, company, location, type, salary, and provides an Apply button.
'use client';

import React from 'react';
import { MapPin, Clock, DollarSign, Building2, Mail } from 'lucide-react';
import { Job } from '../types';

// Props for JobCard: job data, click handler, and apply handler
interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
  onApply: (job: Job) => void;
}

export function JobCard({ job, onClick, onApply }: JobCardProps) {
  // Formats the salary range for display
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (!max) return `$${min?.toLocaleString()}+`;
    if (!min) return `Up to $${max?.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  // Formats the job's posted date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 group cursor-pointer" onClick={(e)=>{e.stopPropagation();onClick(job)}}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center text-gray-600 mb-2">
            <Building2 className="w-4 h-4 mr-2" />
            <span className="font-medium">{job.company}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span className="capitalize">{job.type.replace('-', ' ')}</span>
        </div>
        {formatSalary(job.salary_min, job.salary_max) && (
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            <span>{formatSalary(job.salary_min, job.salary_max)}</span>
          </div>
        )}
      </div>

      <p className="text-gray-700 mb-4 line-clamp-3">
        {job.description}
      </p>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          Posted {formatDate(job.created_at)}
        </span>
        <button
          onClick={(e) => {e.stopPropagation();onApply(job)}}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Mail className="w-4 h-4 mr-2" />
          Apply Now
        </button>
      </div>
    </div>
  );
}