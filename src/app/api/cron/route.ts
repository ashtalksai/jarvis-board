import { NextResponse } from 'next/server';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export async function GET() {
  try {
    // Attempt to fetch from Clawdbot cron API
    const response = await fetch('http://localhost:9753/api/cron/jobs', {
      signal: AbortSignal.timeout(2000), // 2s timeout
    });

    if (!response.ok) {
      throw new Error(`Clawdbot API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Clawdbot response to our format
    const cronJobs: CronJob[] = Array.isArray(data) ? data.map((job: any) => ({
      id: job.id || job.name,
      name: job.name || job.id,
      schedule: job.schedule || job.cron,
      enabled: job.enabled !== false,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
    })) : [];

    return NextResponse.json({ success: true, data: cronJobs });
  } catch (error: any) {
    console.error('Failed to fetch cron jobs:', error.message);
    
    // Return empty array with error flag instead of failing
    return NextResponse.json({
      success: false,
      error: 'Clawdbot API unavailable',
      data: [],
    }, { status: 200 }); // Return 200 so client can handle gracefully
  }
}
