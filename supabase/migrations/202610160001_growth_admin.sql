alter table public.growth_memberships
  add column if not exists member_code text generated always as (
    upper(substr(replace(id::text, '-', ''), 1, 8))
  ) stored,
  add column if not exists membership_plan text not null default 'monthly'
    check (membership_plan in ('monthly', 'yearly')),
  add column if not exists membership_start_date date,
  add column if not exists membership_end_date date,
  add column if not exists created_at timestamptz default now();

create table if not exists public.growth_payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.growth_memberships(id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  membership_plan text not null check (membership_plan in ('monthly', 'yearly')),
  payment_method text not null default 'UPI',
  payment_reference text not null unique,
  transaction_reference text,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'failed', 'refunded')),
  paid_at timestamptz,
  receipt_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.growth_membership_periods (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.growth_memberships(id) on delete cascade,
  payment_id uuid not null unique references public.growth_payments(id) on delete restrict,
  membership_plan text not null check (membership_plan in ('monthly', 'yearly')),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index if not exists growth_payments_membership_date_idx
  on public.growth_payments (membership_id, created_at desc);
create index if not exists growth_memberships_member_code_idx
  on public.growth_memberships (member_code);
create index if not exists growth_payments_verified_date_idx
  on public.growth_payments (paid_at desc) where status = 'verified';
create unique index if not exists growth_payments_transaction_reference_unique_idx
  on public.growth_payments (transaction_reference) where transaction_reference is not null;
create index if not exists growth_memberships_status_expiry_idx
  on public.growth_memberships (membership_status, membership_end_date);
create index if not exists growth_membership_periods_member_date_idx
  on public.growth_membership_periods (membership_id, starts_on desc);

alter table public.growth_payments enable row level security;
alter table public.growth_membership_periods enable row level security;
revoke all on public.growth_payments from anon, authenticated;
revoke all on public.growth_membership_periods from anon, authenticated;
grant all on public.growth_payments to service_role;
grant all on public.growth_membership_periods to service_role;

create or replace function public.growth_admin_verify_payment(
  p_payment_id uuid,
  p_transaction_reference text,
  p_paid_at timestamptz,
  p_receipt_url text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_row public.growth_payments%rowtype;
  member_row public.growth_memberships%rowtype;
  period_start date;
  period_end date;
  local_today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  select * into payment_row
  from public.growth_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;
  if payment_row.status = 'verified' then
    raise exception 'Payment has already been verified';
  end if;
  if nullif(trim(p_transaction_reference), '') is null then
    raise exception 'A verified transaction reference is required';
  end if;

  select * into member_row
  from public.growth_memberships
  where id = payment_row.membership_id
  for update;

  period_start := greatest(local_today, coalesce(member_row.membership_end_date + 1, local_today));
  if payment_row.membership_plan = 'yearly' then
    period_end := (period_start + interval '1 year')::date - 1;
  else
    period_end := (period_start + interval '1 month')::date - 1;
  end if;

  update public.growth_payments
  set status = 'verified',
      transaction_reference = trim(p_transaction_reference),
      paid_at = coalesce(p_paid_at, now()),
      receipt_url = nullif(trim(p_receipt_url), '')
  where id = p_payment_id;

  insert into public.growth_membership_periods (
    membership_id, payment_id, membership_plan, starts_on, ends_on
  ) values (
    payment_row.membership_id, payment_row.id, payment_row.membership_plan, period_start, period_end
  );

  update public.growth_memberships
  set membership_plan = payment_row.membership_plan,
      membership_start_date = period_start,
      membership_end_date = period_end,
      membership_status = 'active',
      payment_status = 'paid'
  where id = payment_row.membership_id;

  return jsonb_build_object('starts_on', period_start, 'ends_on', period_end);
end;
$$;

revoke all on function public.growth_admin_verify_payment(uuid, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.growth_admin_verify_payment(uuid, text, timestamptz, text) to service_role;
