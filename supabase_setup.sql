-- Create the users table
create table users (
  id bigint primary key generated always as identity,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table users enable row level security;

-- Create policy for users to read their own data
create policy "users can read own data"
on public.users
for select
to authenticated
using (auth.uid()::text = id::text);

-- Create policy for users to update their own data
create policy "users can update own data"
on public.users
for update
to authenticated
using (auth.uid()::text = id::text);

-- Create policy for users to insert their own data
create policy "users can insert own data"
on public.users
for insert
to authenticated
with check (auth.uid()::text = id::text);

-- Create function to handle updated_at timestamp
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger handle_users_updated_at
  before update on users
  for each row
  execute function handle_updated_at();

-- Insert some sample data (optional - you can remove this if you don't want sample data)
insert into users (email, full_name, avatar_url)
values
  ('john.doe@example.com', 'John Doe', 'https://example.com/avatar1.jpg'),
  ('jane.smith@example.com', 'Jane Smith', 'https://example.com/avatar2.jpg'),
  ('bob.wilson@example.com', 'Bob Wilson', 'https://example.com/avatar3.jpg'); 