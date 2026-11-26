-- O catálogo cota pelo servidor. Somente o servidor administra as credenciais.
revoke all privileges on table public.integrations from public, anon, authenticated;
