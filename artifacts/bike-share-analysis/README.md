# Bike-share data analysis

A reproducible portfolio project using Python and pandas to clean, validate, analyze, and visualize two years of hourly Capital Bikeshare demand. The report asks: **How do rider type, time, calendar patterns, and reported weather relate to bike rentals?**

## See the results

Open the live report in the app preview. Its charts are generated from the same Python pipeline used to clean the source data; the interactive report includes the findings, data-quality checks, source notes, and limits on interpretation.

## Run the analysis

Python 3.10 or newer is recommended.

```bash
python -m pip install -r analysis/requirements.txt
python analysis/analyze.py
```

The pipeline reads `analysis/data/hour.csv`, validates and cleans the hourly records, writes `analysis/outputs/cleaned_hourly.csv`, exports summary tables to `public/data/bikeshare-analysis.json`, and creates three Matplotlib charts in `analysis/outputs/charts/`.

The supplied CSV is included so the project runs without a network connection. To refresh it, download `hour.csv` from the [UCI Bike Sharing Dataset](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset) and replace `analysis/data/hour.csv`.

## What the pipeline demonstrates

- Explicit type conversion for date and numeric columns
- Null, duplicate, range, calendar, key, and component-total checks
- Reproducible feature engineering for weekday, day type, season, and weather
- Grouped analysis by hour, weekday, day type, month, and weather
- Charts generated with pandas and Matplotlib
- A data-quality audit that reports the records removed at each stage
- A clear separation between observed association and causal claims

The source is a **two-year hourly aggregate**, not individual ride-level data. Each observation is one hour; `cnt` is the total rentals in that hour. Results describe the historical Washington, D.C. data from 2011–2012 and should not be generalized to current systems without new data.

## Dataset and citation

Fanaee-T, H. & Gama, J. (2013). “Event labeling combining ensemble detectors and background knowledge.” *Progress in Artificial Intelligence*. <https://doi.org/10.1007/s13748-013-0040-3>

Dataset: [UCI Machine Learning Repository — Bike Sharing Dataset](https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset). The original source notes and attribution are in the UCI download.