from __future__ import annotations

import os
from functools import lru_cache

import numpy as np
import pandas as pd
import timesfm
import torch
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, field_validator


MODEL_ID = os.getenv("TIMESFM_MODEL_ID", "google/timesfm-2.5-200m-pytorch")
API_KEY = os.getenv("TIMESFM_API_KEY", "")
MAX_CONTEXT = int(os.getenv("TIMESFM_MAX_CONTEXT", "15000"))
MAX_HORIZON = int(os.getenv("TIMESFM_MAX_HORIZON", "1000"))

app = FastAPI(
    title="WebDock TimesFM API",
    version="1.0.0",
    description="TimesFM 2.5 forecasting service for WebDock.",
)


class ForecastRequest(BaseModel):
  dates: list[str] = Field(min_length=20, max_length=15000)
  values: list[float] = Field(min_length=20, max_length=15000)
  frequency: str = Field(pattern=r"^(h|D|W|MS|QS)$")
  horizon: int = Field(ge=1, le=1000)
  non_negative: bool = True

  @field_validator("values")
  @classmethod
  def finite_values(cls, values: list[float]) -> list[float]:
    if not np.all(np.isfinite(values)):
      raise ValueError("values must contain only finite numbers")
    return values


class ForecastPoint(BaseModel):
  date: str
  forecast: float
  lower_10: float
  upper_90: float


class ForecastResponse(BaseModel):
  model: str
  context_points: int
  forecast: list[ForecastPoint]


def authorize(authorization: str | None = Header(default=None)) -> None:
  if not API_KEY:
    return
  if authorization != f"Bearer {API_KEY}":
    raise HTTPException(status_code=401, detail="Invalid API key")


@lru_cache(maxsize=1)
def load_model():
  torch.set_float32_matmul_precision("high")
  model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(MODEL_ID)
  model.compile(
      timesfm.ForecastConfig(
          max_context=MAX_CONTEXT,
          max_horizon=MAX_HORIZON,
          normalize_inputs=True,
          use_continuous_quantile_head=True,
          force_flip_invariance=True,
          infer_is_positive=True,
          fix_quantile_crossing=True,
      )
  )
  return model


@app.get("/health")
def health() -> dict[str, str]:
  return {"status": "ok", "model": MODEL_ID}


@app.post(
    "/forecast",
    response_model=ForecastResponse,
    dependencies=[Depends(authorize)],
)
def forecast(payload: ForecastRequest) -> ForecastResponse:
  if len(payload.dates) != len(payload.values):
    raise HTTPException(status_code=400, detail="dates and values must have equal length")
  if payload.horizon > MAX_HORIZON:
    raise HTTPException(
        status_code=400,
        detail=f"horizon must be {MAX_HORIZON} or less",
    )

  parsed_dates = pd.to_datetime(payload.dates, errors="coerce")
  if parsed_dates.isna().any():
    raise HTTPException(status_code=400, detail="dates contain invalid values")

  order = np.argsort(parsed_dates.to_numpy())
  values = np.asarray(payload.values, dtype=np.float32)[order][-MAX_CONTEXT:]
  last_date = pd.Timestamp(parsed_dates[order][-1])

  try:
    point_forecast, quantile_forecast = load_model().forecast(
        horizon=payload.horizon,
        inputs=[values],
    )
  except Exception as exc:
    raise HTTPException(status_code=500, detail=f"forecast failed: {exc}") from exc

  point = np.asarray(point_forecast[0], dtype=float)
  quantiles = np.asarray(quantile_forecast[0], dtype=float)
  if quantiles.ndim != 2 or quantiles.shape[1] < 10:
    raise HTTPException(status_code=500, detail="unexpected quantile output")

  lower = quantiles[:, 1]
  upper = quantiles[:, 9]
  if payload.non_negative:
    point = np.maximum(point, 0)
    lower = np.maximum(lower, 0)
    upper = np.maximum(upper, 0)

  offset = pd.tseries.frequencies.to_offset(payload.frequency)
  future_dates = pd.date_range(
      start=last_date + offset,
      periods=payload.horizon,
      freq=offset,
  )
  points = [
      ForecastPoint(
          date=date.isoformat(),
          forecast=float(point[index]),
          lower_10=float(lower[index]),
          upper_90=float(upper[index]),
      )
      for index, date in enumerate(future_dates)
  ]
  return ForecastResponse(
      model="TimesFM 2.5 200M",
      context_points=len(values),
      forecast=points,
  )
