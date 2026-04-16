# SSO_PRUEBAS

Aplicación web estática para registrar inspecciones de Salud y Seguridad Ocupacional (SSO) por sucursal.

## Funcionalidades

- Inicio de sesión de administrador (demo): `admin / admin123`.
- Formulario completo con los campos solicitados para hallazgos SSO.
- Carga de evidencia y resultado en formato JPG.
- Persistencia local de registros en `localStorage`.
- Descarga de Excel con columnas en el orden solicitado.
- Gráficas al ingresar como administrador:
  - Conformidades vs No conformidades por sucursal y total empresa.
  - Extintores y Botiquines por sucursal y total empresa.
- Descarga de PDF por sucursal para envío a responsables.

## Cómo usar

1. Abrir `index.html` en un navegador moderno.
2. Ingresar con las credenciales demo.
3. Registrar inspecciones en el formulario.
4. Usar los botones de exportación para generar Excel o PDF.

## Nota

Esta versión es cliente puro (sin backend), por lo que los datos se guardan en el navegador local.
