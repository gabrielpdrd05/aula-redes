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
    live_chunk_minutes: int = Field(10, ge=3, le=30)  # en directos: cada cuánto se sacan clips
    auto_publish: list[str] = Field(default_factory=list)  # youtube, tiktok, instagram, facebook

    @model_validator(mode="after")
    def _check(self) -> "JobOptions":
        allowed = {"youtube", "tiktok", "instagram", "facebook"}
        self.auto_publish = [p for p in dict.fromkeys(self.auto_publish) if p in allowed]
        if self.max_seconds < self.min_seconds + 5:
            self.max_seconds = self.min_seconds + 5
        return self


class JobCreate(BaseModel):
    url: str = Field(..., min_length=8, max_length=2000)
    options: JobOptions = JobOptions()


class WatcherCreate(BaseModel):
    url: str = Field(..., min_length=8, max_length=500)
    options: JobOptions = JobOptions()


class PublishRequest(BaseModel):
    platforms: list[str] = Field(..., min_length=1)
    title: str | None = Field(None, max_length=150)
    caption: str | None = Field(None, max_length=2200)
