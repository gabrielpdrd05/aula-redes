from typing import Literal

from pydantic import BaseModel, Field, model_validator


class JobOptions(BaseModel):
    num_clips: int = Field(0, ge=0, le=20)  # 0 = que decida la IA
    min_seconds: int = Field(20, ge=5, le=170)
    max_seconds: int = Field(60, ge=10, le=180)
    layout: Literal["auto", "crop", "blur", "horizontal"] = "auto"
    subtitle_style: Literal["viral", "verde", "caja", "minimal"] = "viral"
    language: str = Field("auto", max_length=8)
    uppercase: bool = True
    hook_title: bool = True
    max_live_minutes: int = Field(60, ge=1, le=240)
    instructions: str = Field("", max_length=500)

    @model_validator(mode="after")
    def _check(self) -> "JobOptions":
        if self.max_seconds < self.min_seconds + 5:
            self.max_seconds = self.min_seconds + 5
        return self


class JobCreate(BaseModel):
    url: str = Field(..., min_length=8, max_length=2000)
    options: JobOptions = JobOptions()
