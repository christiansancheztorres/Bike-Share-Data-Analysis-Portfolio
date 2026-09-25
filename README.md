# Bike-Share Demand Analysis

An end-to-end data analysis portfolio project using **Python, pandas, and Matplotlib** to study Capital Bikeshare demand in Washington, D.C. The question: **How do rider type, time, calendar patterns, and reported weather relate to rentals?**

The project also includes an interactive web report with charts, downloadable chart data, methodology, and evidence-based conclusions.

## Key findings

- The 2011–2012 dataset contains **17,379 hourly observations**, representing **3,292,679 rentals**. An observation is an *hourly count*, not an individual trip.
- Registered riders account for **81.2%** of rentals. Their average hourly demand peaks at **5 PM**, while casual rider demand peaks at **2 PM**.
- Casual riders make up **13.2%** of working-day rentals versus **31.7%** on weekends and holidays.
- Average hourly rentals during light rain or snow are **45.5% lower** than during clear conditions in this dataset. This is an association, not proof that weather alone caused the difference.

## What I built

1. **Cleaning and validation:** The Python pipeline parses dates and numbers, checks missing values, duplicate rows and hourly keys, valid ranges, calendar fields, and whether `casual + registered = total`.
2. **Analysis:** pandas groups demand by hour, rider type, weekday, working-day status, month, season, and reported weather.
3. **Visualization:** Matplotlib exports static charts; the web report renders interactive charts from the pipeline's generated JSON.
4. **Communication:** The report pairs quantified findings with operational implications, source notes, a quality audit, and limitations.

The source passed all checks: **17,379 rows in, 17,379 rows out**, with no missing, duplicate, or invalid rows found. This project demonstrates transparent validation and preparation, not the repair of a messy dataset.

## Explore the code

| File | Purpose |
| --- | --- |
| [`artifacts/bike-share-analysis/analysis/analyze.py`](artifacts/bike-share-analysis/analysis/analyze.py) | Python cleaning, analysis, and chart exports |
| [`artifacts/bike-share-analysis/analysis/data/hour.csv`](artifacts/bike-share-analysis/analysis/data/hour.csv) | Included original hourly CSV |
| [`artifacts/bike-share-analysis/analysis/outputs/`](artifacts/bike-share-analysis/analysis/outputs/) | Cleaned CSV and Matplotlib charts |
| [`artifacts/bike-share-analysis/public/data/bikeshare-analysis.json`](artifacts/bike-share-analysis/public/data/bikeshare-analysis.json) | Generated data consumed by the report |
| [`artifacts/bike-share-analysis/README.md`](artifacts/bike-share-analysis/README.md) | Detailed analysis notes and instructions |

## Reproduce the analysis

From the repository root, with Python 3.10 or newer:

```bash
python -m pip install -r artifacts/bike-share-analysis/analysis/requirements.txt
python artifacts/bike-share-analysis/analysis/analyze.py
```

This regenerates the cleaned CSV, static charts, and JSON used by the report. In Replit, open the **Bike-Share Data Analysis** preview to see the interactive report.

## Scope and limitations

This is historical **2011–2012 hourly aggregate** data from one bike-share system. It contains rental counts, not individual trip paths or durations. Comparisons are descriptive and may be affected by other factors; they are not causal estimates or forecasts of current demand. The raw season codes are ambiguously documented, so the pipeline derives seasons from calendar months instead.

## Source

[UCI Machine Learning Repository — Bike Sharing Dataset](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset). Citation: Fanaee-T, H. & Gama, J. (2013). “Event labeling combining ensemble detectors and background knowledge.” *Progress in Artificial Intelligence*. [doi:10.1007/s13748-013-0040-3](https://doi.org/10.1007/s13748-013-0040-3).