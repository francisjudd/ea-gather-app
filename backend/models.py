"""Request/response models. JSON uses camelCase to match the frontend types."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Church(ApiModel):
    id: str
    name: str
    address: str
    place: str
    postcode: str | None
    lat: float
    lng: float
    denomination: str
    operating_hours: str
    verified: bool
    initiatives: list[str]
    website: str | None
    phone: str | None
    constituency: str | None
    distance_miles: float | None = None


class Initiative(ApiModel):
    id: str
    label: str


class GeocodeResult(ApiModel):
    lat: float
    lng: float


class Mp(ApiModel):
    name: str
    party: str | None
    email: str | None
    constituency: str
    postcode: str


SubmissionStatus = Literal["pending", "approved", "rejected"]


class ChurchSubmissionIn(ApiModel):
    name: str = Field(min_length=1, max_length=200)
    denomination: str = Field(default="", max_length=200)
    address: str = Field(min_length=1, max_length=500)
    place: str = Field(default="", max_length=200)
    postcode: str = Field(default="", max_length=10)
    operating_hours: str = Field(default="", max_length=500)
    contact_name: str = Field(min_length=1, max_length=200)
    contact_email: EmailStr
    initiatives: list[str] = Field(default_factory=list, max_length=50)

    model_config = ConfigDict(str_strip_whitespace=True)


class ChurchSubmission(ApiModel):
    id: str
    name: str
    denomination: str
    address: str
    place: str
    postcode: str
    operating_hours: str
    contact_name: str
    contact_email: str
    initiatives: list[str]
    status: SubmissionStatus
    submitted_at: datetime


class SubmissionUpdate(ApiModel):
    status: SubmissionStatus | None = None
    initiatives: list[str] | None = Field(default=None, max_length=50)
