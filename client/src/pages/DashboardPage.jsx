import React, { useState, useEffect } from 'react';
import HeaderProfile from '../components/dashboard/HeaderProfile';
import RecommendationHero from '../components/dashboard/RecommendationHero';
import JobsTable from '../components/dashboard/JobsTable';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/common/Button';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsData, candsData, intsData, recsData] = await Promise.all([
        api.getJobs(),
        api.getCandidates(),
        api.getInterviews(),
        api.getRecommendations()
      ]);

      setJobs(jobsData?.data || []);
      setCandidates(candsData?.data || []);
      setInterviews(intsData?.data || []);
      setRecommendations(recsData?.data || []);
    } catch (err) {
      console.warn('Dashboard data fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const topMatch = recommendations[0] || null;
  const currentOpenJob = jobs.find((j) => j.status === 'Open') || jobs[0];

  return (
    <div className="space-y-6">
      {/* 1. Header Profile matching screenshot layout */}
      <HeaderProfile />

      {/* Error alert if backend unreachable */}
      {error && (
        <div className="p-4 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-2xl flex items-center justify-between text-xs text-[#F87171]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} icon={RefreshCw}>
            Retry
          </Button>
        </div>
      )}

      {/* 2. Recommendation Hero matching screenshot */}
      <RecommendationHero
        candidateMatch={topMatch}
        currentJob={currentOpenJob}
        onInterviewScheduled={fetchData}
      />

      {/* 3. Your Jobs Interactive Table directly beneath */}
      <JobsTable
        jobs={jobs}
        onJobUpdated={fetchData}
        onJobCreated={fetchData}
      />
    </div>
  );
}
