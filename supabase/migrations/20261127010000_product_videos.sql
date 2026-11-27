begin;

alter table public.products
  add column if not exists video_urls text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-videos', 'product-videos', true, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do nothing;

create policy "Admins upload product videos" on storage.objects
for insert to authenticated with check (
  bucket_id = 'product-videos' and public.has_role(auth.uid(), 'admin')
);

commit;
