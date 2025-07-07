// Home page for the job board application.
// Displays job listings, job details modal, and application form modal.
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, TrendingUp, Users, Building2, CheckCircle } from 'lucide-react';
import { JobCard } from './components/JobCard';
import { ApplicationForm } from './components/ApplicationForm';
import { SearchFilters } from './components/SearchFilters';
import { JobDetailModal } from './components/JobDetails';
import { Job, CreateApplicationData } from './types';

export default function Home() {
  // State for job data, UI flags, and filters
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fetch jobs from the API on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Fetches job data from the backend API
  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Jobs fetch failed');
      const data: Job[] = await res.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filters jobs based on search, location, and type
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocation = !locationFilter || 
                             job.location.toLowerCase().includes(locationFilter.toLowerCase());

      const matchesType = !typeFilter || job.type === typeFilter;

      return matchesSearch && matchesLocation && matchesType;
    });
  }, [jobs, searchQuery, locationFilter, typeFilter]);

  // Opens the application form for a selected job
  const handleApplyToJob = (job: Job) => {
    setSelectedJob(job);
    setIsApplicationFormOpen(true);
  };

  // Handles application form submission and shows success message
  const handleSubmitApplication = async (applicationData: CreateApplicationData) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });
      
      if (response.ok) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
    }
  };

  // Opens the job details modal
  const openJobDetail = (job: Job) => {
    setDetailJob(job);
  }

  // Closes the application form modal
  const closeApplicationForm = () => {
    setIsApplicationFormOpen(false);
    setSelectedJob(null);
  };

  if (loading) {
    // Show loading spinner while jobs are being fetched
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job board...</p>
        </div>
      </div>
    );
  }

  // Calculate job board statistics
  const stats = {
    totalJobs: jobs.length,
    companies: new Set(jobs.map(job => job.company)).size,
    recentJobs: jobs.filter(job => {
      const jobDate = new Date(job.postDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return jobDate > weekAgo;
    }).length
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Application submitted successfully!
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Briefcase className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">JobBoard Pro</h1>
                <p className="text-gray-600">Find your next career opportunity</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentJobs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          locationFilter={locationFilter}
          onLocationChange={setLocationFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
        />

        {/* Jobs Grid */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredJobs.length === jobs.length 
                ? `All Jobs (${jobs.length})` 
                : `Filtered Jobs (${filteredJobs.length} of ${jobs.length})`}
            </h2>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {jobs.length === 0 ? 'No jobs posted yet' : 'No jobs match your filters'}
              </h3>
              <p className="text-gray-500 mb-6">
                {jobs.length === 0 
                  ? 'Be the first to post a job opportunity!'
                  : 'Try adjusting your search criteria to find more opportunities.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={openJobDetail}
                  onApply={handleApplyToJob}
                />
              ))}
            </div>
          )}
        </div>
      </main>
          {/* Job Details */}
          {detailJob && (
        <JobDetailModal
          job={detailJob}
          onClose={() => setDetailJob(null)}
        />
      )}

      {/* Application Form Modal */}
      <ApplicationForm
        job={selectedJob}
        onSubmit={handleSubmitApplication}
        onClose={closeApplicationForm}
        isOpen={isApplicationFormOpen}
      />
    </div>
  );
}