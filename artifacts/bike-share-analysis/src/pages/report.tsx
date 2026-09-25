import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Bike, Moon, Printer, Sun } from 'lucide-react';
import { useReport } from '../hooks/use-report';
import { DayTypeChart, Figure, HourlyChart, MonthlyChart, RiderLegend, WeekdayChart } from '../components/report-charts';

const number = (value: number) => value.toLocaleString('en-US');
const decimal = (value: number) => value.toFixed(1);
const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

export default function ReportPage() {
  const { data, loading, error, retry } = useReport();
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('bikeshare-theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('bikeshare-theme', dark ? 'dark' : 'light'); } catch { /* Storage may be unavailable. */ }
  }, [dark]);

  return <div className="report">
    <header className="topbar">
      <div className="report-wrap topbar-inner">
        <a href="#top" className="brand" data-testid="link-top" aria-label="Return to report top">
          <span className="brand-mark"><Bike size={19} strokeWidth={1.7} aria-hidden="true" /></span>
          <span>THE MOBILITY INDEX <span style={{ color:'var(--orange)', marginLeft:5 }}> / 01</span></span>
        </a>
        <div className="top-actions">
          <button className="top-link" data-testid="button-print-report" onClick={() => window.print()} type="button" aria-label="Print or save report as PDF" title="Print / save as PDF" disabled={loading || !!error}>
            <Printer size={15} aria-hidden="true" /><span>PRINT / PDF</span>
          </button>
          <button className="icon-button" data-testid="button-toggle-theme" onClick={() => setDark(value => !value)} type="button"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>

    {loading ? <main className="report-wrap loading-page" aria-label="Loading analysis">
      <div className="eyebrow muted">Preparing the analysis</div>
      <div className="skeleton" style={{ height:88, width:'min(660px, 85%)', marginTop:30 }} />
      <div className="skeleton" style={{ height:25, width:'min(410px, 65%)' }} />
      <div className="skeleton" style={{ height:320, width:'100%', marginTop:80 }} />
    </main> : error ? <main className="report-wrap error-page" role="alert" data-testid="status-report-error">
      <span className="eyebrow" style={{ color:'var(--orange)' }}>Data unavailable / 01</span>
      <h1 className="display">The report missed its connection.</h1>
      <p>{error} The analysis is read from a local, generated JSON file. Check that the Python pipeline has produced the report data, then try again.</p>
      <button className="top-link" onClick={retry} data-testid="button-retry-report" type="button">TRY AGAIN <ArrowUpRight size={14} /></button>
    </main> : data ? <>
      <section className="hero" id="top" aria-labelledby="report-title">
        <div className="report-wrap hero-inner">
          <div>
            <div className="hero-kicker eyebrow">FIELD NOTES / WASHINGTON, D.C. / 2011—2012</div>
            <h1 className="display" id="report-title">What shapes<br />a <em>bike-share</em> ride?</h1>
            <p className="hero-desc">A close reading of two years of Capital Bikeshare: when people ride, who rides, and how demand changes with the calendar and the weather.</p>
          </div>
          <div className="hero-bottom">
            <div className="hero-meta">
              <div><span className="eyebrow">STUDY PERIOD</span><strong>{data.metadata.period}</strong></div>
              <div><span className="eyebrow">OBSERVATIONS</span><strong>{number(data.metadata.analyzed_rows)} hourly records</strong></div>
              <div><span className="eyebrow">METHOD</span><strong>Python / pandas</strong></div>
            </div>
            <a className="hero-scroll" data-testid="link-read-findings" href="#overview">READ THE FINDINGS <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <nav className="section-nav" aria-label="Report sections">
        <div className="report-wrap section-nav-inner">
          <a href="#overview" data-testid="link-overview">OVERVIEW</a>
          <a href="#rhythm" data-testid="link-rhythm">01 / DAILY RHYTHM</a>
          <a href="#seasons" data-testid="link-seasons">02 / SEASONALITY</a>
          <a href="#calendar" data-testid="link-calendar">03 / CALENDAR</a>
          <a href="#weather" data-testid="link-weather">04 / WEATHER</a>
          <a href="#quality" data-testid="link-quality">DATA AUDIT</a>
          <a href="#method" data-testid="link-method">METHOD</a>
        </div>
      </nav>

      <main>
        <section className="report-wrap intro" id="overview" aria-labelledby="overview-title">
          <div className="section-index eyebrow">THE SHORT VERSION<br />EXECUTIVE SUMMARY</div>
          <div className="intro-copy">
            <h2 className="display" id="overview-title">One city.<br />Two ways of riding.</h2>
            <p>Across {number(data.metadata.analyzed_rows)} hourly observations, the system recorded {number(data.summary.total_rides)} rentals. The strongest distinction is not just how much people rode, but <em>when</em> registered and casual riders chose to ride.</p>
            <div className="summary-metrics">
              <div className="metric"><span className="eyebrow muted">TOTAL RENTALS</span><strong className="metric-value" data-testid="text-total-rides">{number(data.summary.total_rides)}</strong><span className="metric-label">over the 2011–2012 study period</span></div>
              <div className="metric"><span className="eyebrow muted">REGISTERED</span><strong className="metric-value" data-testid="text-registered-share">{decimal(data.summary.registered_share_pct)}%</strong><span className="metric-label">{number(data.summary.registered_rides)} rentals</span></div>
              <div className="metric"><span className="eyebrow muted">CASUAL</span><strong className="metric-value" data-testid="text-casual-share">{decimal(data.summary.casual_share_pct)}%</strong><span className="metric-label">{number(data.summary.casual_rides)} rentals</span></div>
            </div>
            <div className="takeaways">
              <div><span className="eyebrow">01 / TIME</span><strong>Different peak hours.</strong><p>Registered demand peaks at {clock(data.summary.registered_peak_hour)} ({fmt(data.summary.registered_peak_average)} rides/hour); casual demand peaks at {clock(data.summary.casual_peak_hour)} ({fmt(data.summary.casual_peak_average)} rides/hour).</p></div>
              <div><span className="eyebrow">02 / CALENDAR</span><strong>Day type changes the mix.</strong><p>Casual riders account for {decimal(data.summary.workingday_casual_share_pct)}% of working-day rentals versus {decimal(data.summary.offday_casual_share_pct)}% on weekends and holidays.</p></div>
              <div><span className="eyebrow">03 / CONDITIONS</span><strong>Wet hours are quieter.</strong><p>Average rentals during light rain or snow are {decimal(data.summary.clear_vs_light_rain_drop_pct)}% below clear-weather hours in this dataset.</p></div>
            </div>
          </div>
        </section>

        <section className="report-wrap chapter" id="rhythm" aria-labelledby="rhythm-title">
          <div className="chapter-head"><div className="chapter-num eyebrow">01 / THE DAILY RHYTHM</div><div><h2 className="display" id="rhythm-title">Two clocks,<br />one city.</h2><p className="chapter-lead">The shape of the day changes depending on who is in the saddle. Average rentals per observed hour, grouped by time of day.</p></div></div>
          <Figure title="A day in 24 hours" subtitle="Mean rentals by hour of day and rider type" filename="hourly-rider-patterns.csv" rows={data.hourly}
            foot={<><RiderLegend dark={dark} /><span>Source: hourly aggregate · 2011–2012</span></>}>
            <HourlyChart data={data.hourly} dark={dark} />
          </Figure>
          <div className="analysis-note"><span className="eyebrow">WHAT IT SUGGESTS</span><p>{data.interpretation.registered_peak} The registered curve rises sharply around the morning and evening commute windows; the casual curve builds toward the afternoon. <strong>One operating schedule is unlikely to fit both patterns.</strong> These are averages across all observed days, not trip-level journeys.</p></div>
        </section>

        <section className="report-wrap chapter" id="seasons" aria-labelledby="seasons-title">
          <div className="chapter-head"><div className="chapter-num eyebrow">02 / THE LONG VIEW</div><div><h2 className="display" id="seasons-title">Demand has<br />a season.</h2><p className="chapter-lead">A month-by-month view shows the scale and cadence of rentals across both years. Seasonal averages offer a broader lens.</p></div></div>
          <Figure title="Month by month" subtitle="Mean hourly rentals · Jan 2011 to Dec 2012" filename="monthly-demand.csv" rows={data.monthly}
            foot={<><span>Monthly total and rider-type counts are included in the CSV.</span><span>Unit: average rentals / hour</span></>}>
            <MonthlyChart data={data.monthly} dark={dark} />
          </Figure>
          <div style={{ height:18 }} />
          <Figure title="The seasonal lens" subtitle="Mean hourly rentals by calendar season" filename="seasonal-demand.csv" rows={data.seasonal}
            foot={<><span>Seasons are derived from month, not the source season code.</span><span>Bar length = mean rides / hour</span></>}>
            <div className="season-content" role="group" aria-label="Seasonal average hourly rentals">
              {data.seasonal.map(row => <div className="season-row" key={row.season_name} title={`${row.season_name}: ${decimal(row.average_rides)} average rides per hour across ${number(row.observations)} observations; ${decimal(row.registered_rides)} registered and ${decimal(row.casual_rides)} casual.`}>
                <label>{row.season_name}</label>
                <div className="season-bar" role="img" aria-label={`${row.season_name}: ${decimal(row.average_rides)} average rentals per hour, ${number(row.observations)} observed hours`}><span style={{ width:`${row.average_rides / Math.max(...data.seasonal.map(s => s.average_rides)) * 100}%` }} /></div>
                <b>{fmt(row.average_rides)}</b>
              </div>)}
              <small>Hover a row for rider-type detail; the CSV contains all values and observation counts.</small>
            </div>
          </Figure>
          <div className="analysis-note"><span className="eyebrow">WHAT IT SUGGESTS</span><p>Summer averages {fmt(data.seasonal.find(s => s.season_name === 'Summer')!.average_rides)} rides per hour versus {fmt(data.seasonal.find(s => s.season_name === 'Winter')!.average_rides)} in winter. The monthly series also differs between 2011 and 2012, so <strong>seasonality alone does not explain the entire trend.</strong> Plan capacity from the full calendar, not a single annual average of {fmt(data.summary.average_hourly_rides)} rides per hour.</p></div>
        </section>

        <section className="report-wrap chapter" id="calendar" aria-labelledby="calendar-title">
          <div className="chapter-head"><div className="chapter-num eyebrow">03 / THE CALENDAR</div><div><h2 className="display" id="calendar-title">Weekdays work.<br />Weekends wander.</h2><p className="chapter-lead">Total demand alone hides a change in composition. The share of casual riders grows substantially away from working days.</p></div></div>
          <Figure title="The week in seven parts" subtitle="Mean rentals per observed hour · stacked by rider type" filename="weekday-rider-mix.csv" rows={data.weekday}
            foot={<><RiderLegend dark={dark} /><span>Sunday → Saturday</span></>}>
            <WeekdayChart data={data.weekday} dark={dark} />
          </Figure>
          <div style={{ height:18 }} />
          <Figure title="Working day or day off?" subtitle="Rider mix across working days versus weekends and holidays" filename="day-type-rider-mix.csv" rows={data.day_type}
            foot={<><RiderLegend dark={dark} /><span>Percentages describe the casual share of mean hourly rentals.</span></>}>
            <div style={{ padding:'2px 26px 26px' }}><DayTypeChart data={data.day_type} dark={dark} /></div>
          </Figure>
          <div className="analysis-note"><span className="eyebrow">WHAT IT SUGGESTS</span><p>{data.interpretation.rider_mix} Saturday has the highest casual average among weekdays ({fmt(data.weekday.find(d => d.weekday_name === 'Saturday')!.casual)} rides/hour). <strong>Use day-type and rider-type views together</strong> when considering rebalancing and service coverage.</p></div>
        </section>

        <section className="report-wrap chapter" id="weather" aria-labelledby="weather-title">
          <div className="chapter-head"><div className="chapter-num eyebrow">04 / REPORTED WEATHER</div><div><h2 className="display" id="weather-title">When the<br />sky changes.</h2><p className="chapter-lead">Hourly rentals are associated with reported conditions. The size of each weather category matters for interpreting the comparison.</p></div></div>
          <Figure title="Rentals by weather category" subtitle="Mean rentals per observed hour · category counts shown below" filename="weather-demand.csv" rows={data.weather}
            foot={<><span>Weather categories come from the source dataset.</span><span>Bar length = mean rides / hour</span></>}>
            <div className="weather-list" role="group" aria-label="Average rentals by reported weather">
              {data.weather.map(row => <div className="weather-row" key={row.weather_label} title={`${row.weather_label}: ${decimal(row.average_rides)} average rides per hour; ${number(row.observations)} hours; registered ${decimal(row.registered_rides)}, casual ${decimal(row.casual_rides)} per hour`}>
                <div className="name">{row.weather_label}<small>{number(row.observations)} observed hours</small></div>
                <div className="weather-track" role="img" aria-label={`${row.weather_label}: ${decimal(row.average_rides)} average rentals per hour over ${number(row.observations)} hours`}>
                  <div className="weather-fill" style={{ width:`${row.average_rides / Math.max(...data.weather.map(w => w.average_rides)) * 100}%` }} />
                </div>
                <b>{fmt(row.average_rides)}</b>
              </div>)}
            </div>
          </Figure>
          <div className="analysis-note"><span className="eyebrow">READ WITH CARE</span><p>{data.interpretation.weather} The heavy rain or snow group has only {number(data.weather.find(w => w.weather_label === 'Heavy rain or snow')!.observations)} observed hours, so its average is especially unstable. <strong>This comparison is an association, not an estimate of weather’s causal effect:</strong> season, day type, and time of day may also differ between groups.</p></div>
        </section>

        <div className="audit-band" id="quality">
          <section className="report-wrap chapter" aria-labelledby="audit-title">
            <div className="chapter-head"><div className="chapter-num eyebrow">DATA INTEGRITY / THE AUDIT</div><div><h2 className="display" id="audit-title">Nothing hidden<br />in the cleaning.</h2><p className="chapter-lead">The pipeline checks missing values, duplicates, invalid fields, timestamps and rider totals before computing any chart.</p></div></div>
            <div className="audit-grid">
              {[
                ['Input rows', data.quality.input_rows],
                ['Output rows', data.quality.output_rows],
                ['Null cells in source', data.quality.null_cells_in_source],
                ['Duplicate rows removed', data.quality.duplicate_rows_removed],
                ['Invalid rows removed', data.quality.invalid_rows_removed],
                ['Duplicate hourly keys removed', data.quality.duplicate_hourly_keys_removed],
                ['Count mismatches in source', data.quality.count_mismatches_in_source],
              ].map(([label, value]) => <div className="audit-item" key={label} data-testid={`audit-${String(label).toLowerCase().replace(/\W+/g,'-')}`}><span>{label}</span><strong>{number(value as number)}</strong></div>)}
            </div>
            <p className="audit-caption">Here, all {number(data.metadata.downloaded_rows)} input rows passed to the analyzed set. The zero removal counts describe this supplied source file, not a guarantee that future files would pass. The pipeline also validates calendar consistency, value ranges, and that casual + registered = total.</p>
          </section>
        </div>

        <section className="report-wrap chapter" id="implications" aria-labelledby="implications-title">
          <div className="chapter-head"><div className="chapter-num eyebrow">FROM EVIDENCE TO ACTION</div><div><h2 className="display" id="implications-title">Useful signals,<br />not certainties.</h2><p className="chapter-lead">These are operational hypotheses to test against newer, more granular data, not claims about what caused individual rides.</p></div></div>
          <div className="recommendations">
            <article className="recommendation"><span className="eyebrow">01 / TIMING</span><h3>Plan for two peaks.</h3><p>Review bike availability and rebalancing around registered riders’ {clock(data.summary.registered_peak_hour)} peak and casual riders’ {clock(data.summary.casual_peak_hour)} peak. Validate station-level needs before changing operations.</p></article>
            <article className="recommendation"><span className="eyebrow">02 / DAY TYPE</span><h3>Split the schedule.</h3><p>Working days and days off have different rider mixes. Segment future service planning by day type rather than relying on one all-week average.</p></article>
            <article className="recommendation"><span className="eyebrow">03 / CONTEXT</span><h3>Keep a weather lens.</h3><p>Use reported conditions and season as planning context. Do not use the three-hour heavy-weather sample to set policy or infer a causal effect.</p></article>
          </div>
        </section>

        <section className="report-wrap chapter" id="method" aria-labelledby="method-title">
          <div className="chapter-head"><div className="chapter-num eyebrow">METHOD / REPRODUCIBILITY</div><div><h2 className="display" id="method-title">Show the work.</h2><p className="chapter-lead">The figures on this page are generated by a local Python/pandas pipeline, not hand-entered into the interface.</p></div></div>
          <div className="method-grid">
            <div>
              <h3>01 — From source to story</h3>
              <ol>
                <li>Read the supplied <code>analysis/data/hour.csv</code> from the UCI Bike Sharing Dataset.</li>
                <li>Convert dates and numeric fields, validate ranges, calendar values, hourly keys and component totals; remove invalid or duplicate rows.</li>
                <li>Derive weekday, working-day, month, season and weather labels; group hourly rentals with pandas.</li>
                <li>Write cleaned data to <code>analysis/outputs/cleaned_hourly.csv</code>, figures to <code>analysis/outputs/charts/</code> and this report’s data to <code>public/data/bikeshare-analysis.json</code>.</li>
              </ol>
              <p>The source season field is ambiguous against the raw month sequence, so seasons in this report are derived directly from the parsed date: Dec–Feb, Mar–May, Jun–Aug, Sep–Nov.</p>
            </div>
            <div>
              <h3>02 — Reproduce locally</h3>
              <p>From the project root, with Python 3.10 or newer:</p>
              <code className="code-line">python -m pip install -r analysis/requirements.txt<br />python analysis/analyze.py</code>
              <p>For full instructions, see <code>README.md</code>; for cleaning rules and group calculations, see <code>analysis/analyze.py</code> in the project repository. These are project files, not browser download links.</p>
              <h3 style={{ marginTop:30 }}>What this cannot tell us</h3>
              <p>{data.metadata.grain} {data.interpretation.caveat} Rider types are source categories; weather groups and calendar groups may differ on other dimensions. Station locations, routes, and individual behavior are not present here.</p>
            </div>
          </div>
          <div style={{ borderTop:'1px solid var(--line)', marginTop:50, paddingTop:26 }}>
            <span className="eyebrow muted">SOURCE & CITATION</span>
            <p style={{ maxWidth:800, fontSize:13, lineHeight:1.75, color:'var(--quiet)' }}>
              Dataset: <a className="source-link" href={data.metadata.source_url} target="_blank" rel="noopener noreferrer" data-testid="link-uci-source">{data.metadata.source} <ArrowUpRight size={12} style={{ display:'inline' }} aria-hidden="true" /></a>.<br />
              {data.metadata.citation} <a className="source-link" href="https://doi.org/10.1007/s13748-013-0040-3" target="_blank" rel="noopener noreferrer" data-testid="link-study-doi">Open DOI <ArrowUpRight size={12} style={{ display:'inline' }} aria-hidden="true" /></a>
            </p>
          </div>
        </section>
      </main>
      <footer className="footer"><div className="report-wrap footer-inner"><div>THE MOBILITY INDEX <span style={{ color:'var(--orange)' }}> / 01</span></div><span>CAPITAL BIKESHARE · WASHINGTON, D.C. · {data.metadata.period.toUpperCase()}</span><a href="#top" className="source-link" data-testid="link-back-to-top">BACK TO TOP ↑</a></div></footer>
    </> : <main className="report-wrap error-page"><h1 className="display">No report to show.</h1><p>The generated analysis contains no displayable records.</p><button className="top-link" onClick={retry} type="button" data-testid="button-retry-empty">TRY AGAIN</button></main>}
  </div>;
}

function fmt(value: number) { return Math.round(value).toLocaleString('en-US'); }