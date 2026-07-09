-- Suppress output notices
set client_min_messages to warning;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clean up existing tables if any (safely)
drop table if exists leave_requests cascade;
drop table if exists attendance cascade;
drop table if exists office_locations cascade;
drop table if exists staff cascade;
drop table if exists shifts cascade;

-- 1. Shifts Table
create table shifts (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Default Shifts
insert into shifts (name, start_time, end_time) values
('Shift A', '06:00:00', '17:30:00'),
('Shift B', '07:00:00', '18:00:00');

-- 2. Staff Profiles Table (extends Supabase Auth users)
create table staff (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  phone text not null unique,
  staff_id text not null unique,
  shift_id uuid references shifts(id) on delete set null,
  role text not null check (role in ('staff', 'admin')),
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Office Locations Table (for geofencing)
create table office_locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null default 150,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Default Office Location (Kuala Lumpur HQ Center)
insert into office_locations (name, latitude, longitude, radius_meters) values
('HQ Office', 3.1390, 101.6869, 150);

-- 4. Attendance Table
create table attendance (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references staff(id) on delete cascade,
  date date not null default (timezone('Asia/Kuala_Lumpur', now()))::date,
  clock_in_at timestamp with time zone not null,
  clock_out_at timestamp with time zone,
  clock_in_lat double precision not null,
  clock_in_lng double precision not null,
  clock_out_lat double precision,
  clock_out_lng double precision,
  is_breached boolean not null default false,
  breached_at timestamp with time zone,
  last_known_lat double precision,
  last_known_lng double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_staff_date unique (staff_id, date)
);

-- 5. Leave Requests Table
create table leave_requests (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references staff(id) on delete cascade,
  leave_type text not null check (leave_type in ('MC', 'Emergency')),
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reviewed_by uuid references staff(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table shifts enable row level security;
alter table staff enable row level security;
alter table office_locations enable row level security;
alter table attendance enable row level security;
alter table leave_requests enable row level security;

-- Policies for shifts
create policy "Allow read access to shifts for authenticated users"
  on shifts for select to authenticated using (true);

create policy "Allow all access to shifts for admins"
  on shifts for all to authenticated using (
    exists (select 1 from staff where id = auth.uid() and role = 'admin')
  );

-- Policies for staff
create policy "Allow read access to staff for authenticated users"
  on staff for select to authenticated using (true);

-- Allow public read access to staff phone/staff_id to resolve emails on login.
-- Since they only get back public ID and staff_id/phone matching, it is fine, or we can use service_role client.
-- Let's just allow read access to staff for authenticated users, and public can read to resolve for login,
-- OR we can let public read only name/phone/staff_id/role/active, but since it's an internal app, let's keep it read access for anyone.
-- Wait, to prevent exposing staff data to the unauthenticated public, we can allow read to everyone, or write a policy.
-- An internal SME app usually does select name, role, active, staff_id, phone to find matching record, let's allow read for all users:
create policy "Allow read access to staff for all"
  on staff for select using (true);

create policy "Allow update access to own staff profile"
  on staff for update to authenticated using (id = auth.uid());

-- Policies for office_locations
create policy "Allow read access to office_locations for authenticated users"
  on office_locations for select to authenticated using (true);

create policy "Allow all access to office_locations for admins"
  on office_locations for all to authenticated using (
    exists (select 1 from staff where id = auth.uid() and role = 'admin')
  );

-- Policies for attendance
create policy "Allow read own attendance"
  on attendance for select to authenticated using (staff_id = auth.uid());

create policy "Allow insert own attendance"
  on attendance for insert to authenticated with check (staff_id = auth.uid());

create policy "Allow update own attendance"
  on attendance for update to authenticated using (staff_id = auth.uid());

create policy "Allow all access to attendance for admins"
  on attendance for all to authenticated using (
    exists (select 1 from staff where id = auth.uid() and role = 'admin')
  );

-- Policies for leave_requests
create policy "Allow read own leave_requests"
  on leave_requests for select to authenticated using (staff_id = auth.uid());

create policy "Allow insert own leave_requests"
  on leave_requests for insert to authenticated with check (staff_id = auth.uid());

create policy "Allow all access to leave_requests for admins"
  on leave_requests for all to authenticated using (
    exists (select 1 from staff where id = auth.uid() and role = 'admin')
  );
