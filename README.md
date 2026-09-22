# IMPACTO Sorteos

Aplicación independiente para `sorteos.impactoperu.net`.

## Configuración

1. Crear un proyecto Supabase independiente.
2. Ejecutar `supabase/migrations/001_initial.sql`.
3. Crear un bucket privado llamado `payment-proofs`.
4. Configurar las variables de `.env.example` en Vercel.
5. Crear el usuario propietario en Supabase Auth y registrarlo en `admins` con rol `OWNER`.

La selección del ganador se ejecuta en PostgreSQL bajo bloqueo transaccional. La unidad de selección es siempre `ticket_id`; solo el ticket ganador cambia a `WINNER`.
