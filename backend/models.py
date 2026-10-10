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
    contact_first_name: str | None
    contact_surname: str | None
    contact_role: str | None
    contact_email: str | None
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


class ConstituencyProgramme(ApiModel):
    name: str
    category: str


class ConstituencyChurch(ApiModel):
    id: str
    name: str
    denomination: str | None
    address: str | None
    postcode: str | None
    lat: float | None
    lng: float | None
    website: str | None
    phone: str | None
    programmes: list[ConstituencyProgramme]


class ConstituencyService(ApiModel):
    id: str
    category: str
    name: str
    address: str | None
    postcode: str | None
    lat: float | None
    lng: float | None
    website: str | None
    phone: str | None


class ConstituencyMp(ApiModel):
    name: str
    party: str | None
    email: str | None


class ConstituencySummary(ApiModel):
    slug: str
    name: str
    code: str | None
    church_count: int
    service_count: int


class ConstituencyDetail(ConstituencySummary):
    mp: ConstituencyMp | None
    churches: list[ConstituencyChurch]
    services: list[ConstituencyService]
    services_by_category: dict[str, int]


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
