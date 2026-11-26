-- Checkout and guest receipts use the server role. Browser access is limited to
-- order owners and the store admins who create quotes and manage fulfillment.
begin;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies are permissive by default and are combined with OR. Replace the
-- old rules for these two tables together, including names used by older stores.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('orders', 'order_items')
  loop
    execute format('drop policy %I on public.%I', policy_row.policyname, policy_row.tablename);
  end loop;
end $$;

create policy "Admins manage orders" on public.orders
for all to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));

create policy "Customers read own orders" on public.orders
for select to authenticated using (user_id = (select auth.uid()));

create policy "Admins manage order items" on public.order_items
for all to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));

create policy "Customers read own items" on public.order_items
for select to authenticated using (exists (
  select 1 from public.orders o where o.id = order_items.order_id and o.user_id = (select auth.uid())
));

-- The admin creates quotes with shipping_type = 'orcamento'. Legacy quotes can
-- also be identified by a quote-only product. Deleting the order cascades to its items.
-- Read the order and items as one predicate without re-entering the items
-- policy, which itself reads orders. The lookup is always bound to auth.uid().
create or replace function public.can_decline_own_quote(target_order uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.id = target_order and o.user_id = (select auth.uid()) and (
      o.shipping_type = 'orcamento' or exists (
        select 1 from public.order_items i join public.products p on p.id = i.product_id
        where i.order_id = o.id and to_jsonb(p)->>'tipo_venda' = 'orcamento'
      )
    )
  );
$$;
revoke execute on function public.can_decline_own_quote(uuid) from public, anon;
grant execute on function public.can_decline_own_quote(uuid) to authenticated;

create policy "Customers decline own quotes" on public.orders
for delete to authenticated using (
  user_id = (select auth.uid()) and public.can_decline_own_quote(id)
);

-- Legacy SECURITY DEFINER overloads could place an order outside checkout/RLS.
do $$
declare
  signature regprocedure;
begin
  for signature in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'place_order'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', signature);
  end loop;
end $$;

commit;
