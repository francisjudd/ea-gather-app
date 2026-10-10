-- Church submissions from the public /submit form, reviewed in /admin.
-- Apply once: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/scripts/church_submissions.sql

create table church_submissions (
    id                  uuid primary key default gen_random_uuid(),
    name                text not null,
    denomination        text not null default '',
    address             text not null,
    place               text not null default '',
    postcode            text not null default '',
    operating_hours     text not null default '',
    contact_name        text not null,
    contact_email       text not null,
    initiatives         text[] not null default '{}',
    status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected')),
    submitted_at        timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index church_submissions_status on church_submissions (status, submitted_at);

-- set_updated_at() is created by import_combined_db.py.
create trigger church_submissions_updated_at before update on church_submissions
    for each row execute function set_updated_at();

-- RLS on with no policies: only the backend can read or write.
alter table church_submissions enable row level security;
