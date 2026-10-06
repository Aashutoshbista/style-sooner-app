create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first user to sign up becomes admin
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.members (id uuid primary key default gen_random_uuid(), name text not null, role text not null default 'Barber', active boolean not null default true, created_at timestamptz not null default now());
grant select on public.members to anon, authenticated;
grant insert, update, delete on public.members to authenticated;
grant all on public.members to service_role;
alter table public.members enable row level security;
create policy "public read active" on public.members for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.members for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.bookings (id uuid primary key default gen_random_uuid(), customer_name text not null, phone text not null, service text not null, member_id uuid references public.members(id) on delete set null, booking_date date not null, booking_time text not null, status text not null default 'confirmed', created_at timestamptz not null default now(), unique(member_id, booking_date, booking_time));
grant insert on public.bookings to anon, authenticated;
grant select, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "anyone can book" on public.bookings for insert to anon, authenticated with check (status='confirmed' and length(customer_name) between 1 and 100 and length(phone) between 5 and 30);
create policy "admin read" on public.bookings for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.bookings for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.bookings for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.get_taken_slots(_member uuid, _date date) returns setof text language sql stable security definer set search_path=public as $$ select booking_time from public.bookings where member_id=_member and booking_date=_date and status<>'cancelled' $$;
grant execute on function public.get_taken_slots(uuid, date) to anon, authenticated;

insert into public.members(name, role) values ('Mara Vance','Master barber'),('Jonah Reyes','Fade specialist'),('Elena Cho','Stylist');