# LMS HSE STEEL — Inducción Hombre Nuevo

Base de producción para el LMS HSE STEEL.

## Arquitectura
- GitHub Pages: frontend
- Supabase Auth: usuarios y contraseñas
- Supabase PostgreSQL: perfiles, progreso, intentos, certificados y auditoría
- RLS: separación Trabajador / Administrador HSE

## Instalación
1. Crear proyecto Supabase exclusivo para el LMS.
2. Ejecutar `supabase/001_initial_schema.sql` como migración.
3. Copiar Project URL y Publishable Key a `assets/config.js`.
4. Crear usuarios en Supabase Auth.
5. En GitHub Pages seleccionar Branch `main` y carpeta `/ (root)`.

## Roles
- `worker`: solo ve sus datos, progreso y certificado.
- `admin`: puede revisar datos globales.

## Seguridad
Nunca colocar `service_role` en GitHub Pages. El frontend solo utiliza la Publishable Key y la seguridad real depende de RLS.
