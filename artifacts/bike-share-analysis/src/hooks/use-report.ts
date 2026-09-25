import { useEffect, useState } from 'react';

export type RiderPoint = { casual: number; registered: number; cnt: number };
export type Report = {
  metadata: {
    title: string; location: string; period: string; source: string; source_url: string;
    citation: string; grain: string; downloaded_rows: number; analyzed_rows: number;
  };
  summary: {
    total_rides: number; registered_rides: number; casual_rides: number;
    registered_share_pct: number; casual_share_pct: number; average_hourly_rides: number;
    registered_peak_hour: number; registered_peak_average: number;
    casual_peak_hour: number; casual_peak_average: number;
    workingday_casual_share_pct: number; offday_casual_share_pct: number;
    clear_vs_light_rain_drop_pct: number;
  };
  quality: {
    input_rows: number; output_rows: number; null_cells_in_source: number;
    duplicate_rows_removed: number; invalid_rows_removed: number;
    duplicate_hourly_keys_removed: number; count_mismatches_in_source: number;
  };
  hourly: (RiderPoint & { hr: number; hour_label: string })[];
  weekday: (RiderPoint & { weekday_name: string })[];
  day_type: (RiderPoint & { day_type: string })[];
  weather: { weather_label: string; average_rides: number; observations: number; casual_rides: number; registered_rides: number }[];
  seasonal: { season_name: string; average_rides: number; casual_rides: number; registered_rides: number; observations: number }[];
  monthly: { year: number; month: number; month_name: string; period: string; average_rides: number; total_rides: number; casual_rides: number; registered_rides: number }[];
  interpretation: { registered_peak: string; rider_mix: string; weather: string; caveat: string };
};

export function useReport() {
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`${import.meta.env.BASE_URL}data/bikeshare-analysis.json`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`The report data could not be loaded (${response.status}).`);
        return response.json() as Promise<Report>;
      })
      .then(report => {
        if (!report.metadata || !report.summary || !report.hourly?.length || !report.monthly?.length) {
          throw new Error('The report data is incomplete.');
        }
        setData(report);
        setLoading(false);
      })
      .catch(reason => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : 'The report data could not be loaded.');
        setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  return { data, loading, error, retry: () => setAttempt(value => value + 1) };
}