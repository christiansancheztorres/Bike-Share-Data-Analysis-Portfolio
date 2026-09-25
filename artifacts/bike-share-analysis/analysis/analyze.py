"""Clean the UCI Capital Bikeshare hourly data and export report-ready results."""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd


PROJECT_DIR = Path(__file__).resolve().parents[1]
ANALYSIS_DIR = PROJECT_DIR / "analysis"
RAW_FILE = ANALYSIS_DIR / "data" / "hour.csv"
OUTPUT_DIR = ANALYSIS_DIR / "outputs"
WEB_DATA_FILE = PROJECT_DIR / "public" / "data" / "bikeshare-analysis.json"

WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
WEATHER_LABELS = {
    1: "Clear",
    2: "Mist / cloudy",
    3: "Light rain or snow",
    4: "Heavy rain or snow",
}
SEASON_LABELS = {
    1: "Winter",
    2: "Spring",
    3: "Summer",
    4: "Fall",
}
MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def clean_hourly_data(raw: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    """Normalize fields, enforce row-level rules, and return an auditable quality summary."""
    input_rows = len(raw)
    null_cells = int(raw.isna().sum().sum())
    frame = raw.copy()

    numeric_columns = [
        "instant",
        "season",
        "yr",
        "mnth",
        "hr",
        "holiday",
        "weekday",
        "workingday",
        "weathersit",
        "temp",
        "atemp",
        "hum",
        "windspeed",
        "casual",
        "registered",
        "cnt",
    ]
    for column in numeric_columns:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    frame["dteday"] = pd.to_datetime(frame["dteday"], errors="coerce")

    duplicate_rows = int(frame.duplicated().sum())
    frame = frame.drop_duplicates()

    required = ["dteday", *numeric_columns]
    missing_required = frame[required].isna().any(axis=1)
    invalid_ranges = (
        frame["hr"].lt(0)
        | frame["hr"].gt(23)
        | frame["weekday"].lt(0)
        | frame["weekday"].gt(6)
        | frame["weathersit"].lt(1)
        | frame["weathersit"].gt(4)
        | frame["casual"].lt(0)
        | frame["registered"].lt(0)
        | frame["cnt"].lt(0)
        | frame["temp"].lt(0)
        | frame["temp"].gt(1)
        | frame["atemp"].lt(0)
        | frame["atemp"].gt(1)
        | frame["hum"].lt(0)
        | frame["hum"].gt(1)
        | frame["windspeed"].lt(0)
        | frame["windspeed"].gt(1)
    )
    invalid_calendar = (
        frame["weekday"].ne((frame["dteday"].dt.dayofweek + 1) % 7)
        | frame["workingday"].ne(
            ((frame["weekday"].between(1, 5)) & frame["holiday"].eq(0)).astype(int)
        )
    )
    inconsistent_totals = frame["cnt"].ne(frame["casual"] + frame["registered"])
    invalid_mask = missing_required | invalid_ranges | invalid_calendar | inconsistent_totals
    invalid_rows = int(invalid_mask.sum())
    frame = frame.loc[~invalid_mask].copy()

    # Duplicate timestamps cannot represent distinct hourly observations.
    timestamp_duplicates = int(frame.duplicated(subset=["dteday", "hr"]).sum())
    frame = frame.drop_duplicates(subset=["dteday", "hr"], keep="first")

    frame["year"] = frame["dteday"].dt.year
    frame["month"] = frame["dteday"].dt.month
    frame["month_name"] = frame["dteday"].dt.strftime("%b")
    frame["weekday_name"] = frame["weekday"].astype(int).map(dict(enumerate(WEEKDAYS)))
    frame["day_type"] = frame["workingday"].map({1: "Working day", 0: "Weekend / holiday"})
    frame["weather_label"] = frame["weathersit"].map(WEATHER_LABELS)
    # The source's season labels conflict with the month sequence in the raw file.
    # Derive Northern Hemisphere seasons from the parsed date instead of trusting
    # that ambiguous categorical field.
    month_to_season = {
        12: "Winter", 1: "Winter", 2: "Winter",
        3: "Spring", 4: "Spring", 5: "Spring",
        6: "Summer", 7: "Summer", 8: "Summer",
        9: "Fall", 10: "Fall", 11: "Fall",
    }
    frame["season_name"] = frame["month"].map(month_to_season)
    frame["temperature_c"] = frame["temp"] * 41
    frame["feels_like_c"] = frame["atemp"] * 50
    frame["humidity_pct"] = frame["hum"] * 100
    frame["windspeed_kmh"] = frame["windspeed"] * 67

    frame = frame.sort_values(["dteday", "hr"]).reset_index(drop=True)
    audit = {
        "input_rows": input_rows,
        "output_rows": len(frame),
        "null_cells_in_source": null_cells,
        "duplicate_rows_removed": duplicate_rows,
        "invalid_rows_removed": invalid_rows,
        "duplicate_hourly_keys_removed": timestamp_duplicates,
        "count_mismatches_in_source": int(inconsistent_totals.sum()),
    }
    return frame, audit


def _records(frame: pd.DataFrame, columns: list[str]) -> list[dict]:
    """Convert a grouped data frame into JSON-safe records."""
    return json.loads(frame[columns].to_json(orient="records"))


def _chart_exports(frame: pd.DataFrame) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    charts_dir = OUTPUT_DIR / "charts"
    charts_dir.mkdir(parents=True, exist_ok=True)

    colors = {"casual": "#ee6a42", "registered": "#246b61", "total": "#172d2a"}
    hourly = frame.groupby("hr", as_index=False)[["casual", "registered", "cnt"]].mean()
    fig, ax = plt.subplots(figsize=(10, 5.2))
    ax.plot(hourly["hr"], hourly["registered"], label="Registered riders", color=colors["registered"], linewidth=2.6)
    ax.plot(hourly["hr"], hourly["casual"], label="Casual riders", color=colors["casual"], linewidth=2.6)
    ax.set(title="Average hourly rentals by rider type", xlabel="Hour of day", ylabel="Average rentals per hour")
    ax.set_xticks(range(0, 24, 2))
    ax.grid(axis="y", alpha=0.2)
    ax.legend(frameon=False)
    fig.tight_layout()
    fig.savefig(charts_dir / "hourly-rider-patterns.png", dpi=160)
    plt.close(fig)

    monthly = frame.groupby(["year", "month"], as_index=False)["cnt"].mean()
    monthly["period"] = monthly["year"].astype(str) + "-" + monthly["month"].astype(str).str.zfill(2)
    fig, ax = plt.subplots(figsize=(10, 5.2))
    for year, rows in monthly.groupby("year"):
        ax.plot(rows["period"], rows["cnt"], marker="o", markersize=3, label=str(year), linewidth=2.2)
    ax.set(title="Average hourly rentals by month", xlabel="Month", ylabel="Average rentals per hour")
    ax.tick_params(axis="x", rotation=60)
    ax.grid(axis="y", alpha=0.2)
    ax.legend(title="Year", frameon=False)
    fig.tight_layout()
    fig.savefig(charts_dir / "monthly-demand.png", dpi=160)
    plt.close(fig)

    weather = frame.groupby("weather_label", as_index=False)["cnt"].mean()
    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.bar(weather["weather_label"], weather["cnt"], color=["#246b61", "#68a398", "#ee9b52", "#d7684b"][: len(weather)])
    ax.set(title="Average hourly rentals by reported weather", xlabel="", ylabel="Average rentals per hour")
    ax.tick_params(axis="x", rotation=12)
    ax.grid(axis="y", alpha=0.2)
    fig.tight_layout()
    fig.savefig(charts_dir / "weather-demand.png", dpi=160)
    plt.close(fig)


def build_report(frame: pd.DataFrame, audit: dict[str, int]) -> dict:
    total_rides = int(frame["cnt"].sum())
    total_casual = int(frame["casual"].sum())
    total_registered = int(frame["registered"].sum())

    hourly = frame.groupby("hr", as_index=False)[["casual", "registered", "cnt"]].mean()
    hourly["hour_label"] = hourly["hr"].map(lambda value: f"{int(value):02d}:00")
    weekday = frame.groupby(["weekday", "weekday_name"], as_index=False)[["casual", "registered", "cnt"]].mean()
    weekday = weekday.sort_values("weekday")
    day_type = frame.groupby("day_type", as_index=False)[["casual", "registered", "cnt"]].mean()
    weather = frame.groupby(["weathersit", "weather_label"], as_index=False).agg(
        average_rides=("cnt", "mean"),
        observations=("cnt", "size"),
        casual_rides=("casual", "mean"),
        registered_rides=("registered", "mean"),
    )
    weather = weather.sort_values("weathersit")
    seasonal = frame.groupby("season_name", as_index=False).agg(
        average_rides=("cnt", "mean"),
        casual_rides=("casual", "mean"),
        registered_rides=("registered", "mean"),
        observations=("cnt", "size"),
    )
    season_order = {"Winter": 0, "Spring": 1, "Summer": 2, "Fall": 3}
    seasonal = seasonal.sort_values("season_name", key=lambda values: values.map(season_order))

    monthly = frame.groupby(["year", "month", "month_name"], as_index=False).agg(
        average_rides=("cnt", "mean"),
        total_rides=("cnt", "sum"),
        casual_rides=("casual", "sum"),
        registered_rides=("registered", "sum"),
    )
    monthly["period"] = monthly["year"].astype(str) + "-" + monthly["month"].astype(str).str.zfill(2)
    peak_registered = hourly.loc[hourly["registered"].idxmax()]
    peak_casual = hourly.loc[hourly["casual"].idxmax()]
    clear_weather = weather.loc[weather["weathersit"].eq(1), "average_rides"]
    severe_weather = weather.loc[weather["weathersit"].eq(3), "average_rides"]
    weather_difference = (
        float((clear_weather.iloc[0] - severe_weather.iloc[0]) / clear_weather.iloc[0] * 100)
        if not clear_weather.empty and not severe_weather.empty
        else None
    )
    day_type_by_name = day_type.set_index("day_type")
    working_casual_share = float(
        day_type_by_name.loc["Working day", "casual"]
        / day_type_by_name.loc["Working day", "cnt"]
        * 100
    )
    offday_casual_share = float(
        day_type_by_name.loc["Weekend / holiday", "casual"]
        / day_type_by_name.loc["Weekend / holiday", "cnt"]
        * 100
    )

    report = {
        "metadata": {
            "title": "What shapes a bike-share ride?",
            "location": "Washington, D.C. (Capital Bikeshare)",
            "period": f"{frame['dteday'].min():%b %Y} – {frame['dteday'].max():%b %Y}",
            "source": "UCI Machine Learning Repository — Bike Sharing Dataset",
            "source_url": "https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset",
            "citation": "Fanaee-T, H. & Gama, J. (2013). Event labeling combining ensemble detectors and background knowledge. Progress in Artificial Intelligence. https://doi.org/10.1007/s13748-013-0040-3",
            "grain": "One row per hour; rentals are aggregated counts, not individual trip records.",
            "downloaded_rows": audit["input_rows"],
            "analyzed_rows": audit["output_rows"],
        },
        "summary": {
            "total_rides": total_rides,
            "registered_rides": total_registered,
            "casual_rides": total_casual,
            "registered_share_pct": total_registered / total_rides * 100,
            "casual_share_pct": total_casual / total_rides * 100,
            "average_hourly_rides": float(frame["cnt"].mean()),
            "registered_peak_hour": int(peak_registered["hr"]),
            "registered_peak_average": float(peak_registered["registered"]),
            "casual_peak_hour": int(peak_casual["hr"]),
            "casual_peak_average": float(peak_casual["casual"]),
            "workingday_casual_share_pct": working_casual_share,
            "offday_casual_share_pct": offday_casual_share,
            "clear_vs_light_rain_drop_pct": weather_difference,
        },
        "quality": audit,
        "hourly": _records(hourly, ["hr", "hour_label", "casual", "registered", "cnt"]),
        "weekday": _records(weekday, ["weekday_name", "casual", "registered", "cnt"]),
        "day_type": _records(day_type, ["day_type", "casual", "registered", "cnt"]),
        "weather": _records(weather, ["weather_label", "average_rides", "observations", "casual_rides", "registered_rides"]),
        "seasonal": _records(seasonal, ["season_name", "average_rides", "casual_rides", "registered_rides", "observations"]),
        "monthly": _records(monthly, ["year", "month", "month_name", "period", "average_rides", "total_rides", "casual_rides", "registered_rides"]),
        "interpretation": {
            "registered_peak": f"Registered riders peak around {int(peak_registered['hr']):02d}:00 on average, while casual riders peak around {int(peak_casual['hr']):02d}:00.",
            "rider_mix": f"Casual riders account for {working_casual_share:.1f}% of working-day rentals and {offday_casual_share:.1f}% on weekends and holidays.",
            "weather": (
                f"Average hourly rentals in light rain or snow are {weather_difference:.1f}% below clear-weather rentals."
                if weather_difference is not None
                else "Weather comparisons are not available for all requested categories."
            ),
            "caveat": "These are descriptive associations in a historical, hourly aggregate. They do not identify causes, represent individual trips, or predict current demand.",
        },
    }
    return report


def main() -> None:
    if not RAW_FILE.exists():
        raise FileNotFoundError(
            f"Expected the supplied source file at {RAW_FILE}. "
            "Download the UCI Bike Sharing Dataset and place hour.csv there."
        )

    raw = pd.read_csv(RAW_FILE)
    clean, audit = clean_hourly_data(raw)
    if clean.empty:
        raise ValueError("All source rows failed validation; refusing to export an empty report.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    WEB_DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    clean.to_csv(OUTPUT_DIR / "cleaned_hourly.csv", index=False)
    report = build_report(clean, audit)
    WEB_DATA_FILE.write_text(json.dumps(report, indent=2), encoding="utf-8")
    _chart_exports(clean)

    print(f"Rows: {audit['input_rows']:,} raw → {audit['output_rows']:,} clean")
    print(f"Rides: {report['summary']['total_rides']:,}")
    print(report["interpretation"]["registered_peak"])
    print(report["interpretation"]["rider_mix"])
    print(f"Dashboard data: {WEB_DATA_FILE.relative_to(PROJECT_DIR)}")
    print(f"Quality audit: {OUTPUT_DIR / 'cleaned_hourly.csv'}")


if __name__ == "__main__":
    main()