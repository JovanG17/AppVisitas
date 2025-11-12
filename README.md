# PQRS Medellín - Sistema de Registro en Campo

Aplicación web progresiva (PWA) offline-first para registro de Peticiones, Quejas, Reclamos, Sugerencias y Denuncias en campo por parte de cuadrillas y técnicos del sector público de Medellín.

## Características Principales

### Funcionalidad Offline-First
- ✅ **IndexedDB Local**: Base de datos local en el navegador
- ✅ **Cola de Sincronización**: Sistema de reintentos automáticos
- ✅ **Captura Offline**: Funciona sin conexión a internet
- ✅ **Sincronización Automática**: Envío automático al restaurar conexión

### Cálculo de Severidad (Índice IS)
- ✅ **Fórmula IS = 0.4T + 0.4R + 0.2C**
  - **Tamaño (40%)**: Área (m²) y profundidad (cm)
  - **Riesgo (40%)**: Exposición peatonal, vehicular, velocidad vía, proximidad equipamientos
  - **Contexto (20%)**: Antigüedad, reincidencia, vía crítica
- ✅ **Niveles**: Baja (0-39), Media (40-69), Alta (70-100)
- ✅ **SLA Automático**: 24h (Alta), 72h (Media), 7 días (Baja)

### Wizard de 3 Pasos
1. **Ubicación**: GPS automático, dirección, barrio, comuna
2. **Clasificación**: Tipo de afectación, mediciones, riesgos, evidencias fotográficas
3. **Revisión**: Resumen completo, responsable, observaciones, envío

### Captura de Evidencias
- ✅ Hasta 5 fotos por registro
- ✅ Compresión automática (máx 1200px, JPEG 70%)
- ✅ Captura directa desde cámara del dispositivo
- ✅ Fotos obligatorias para severidad Media/Alta

### Gestión de Registros
- ✅ Lista con búsqueda y filtros
- ✅ Vista detallada de cada registro
- ✅ Estado de sincronización en tiempo real
- ✅ Sincronización manual forzada
- ✅ Eliminación de registros

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos Local**: IndexedDB (API nativa)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Estilos**: CSS-in-JS con variables CSS
- **Geolocalización**: Geolocation API nativa
- **PWA**: Service Worker + Web Manifest

## Estructura del Proyecto

\`\`\`
/app
  /page.tsx                 # Página principal con accesos rápidos
  /nuevo/page.tsx          # Wizard de 3 pasos para nuevo registro
  /lista/page.tsx          # Lista de registros con filtros
  /detalle/[id]/page.tsx   # Vista detallada de registro
  /api/pqrs/sync/route.ts  # API endpoint para sincronización
/components
  /forms
    /step1-location.tsx          # Paso 1: Ubicación y GPS
    /step2-classification.tsx    # Paso 2: Clasificación y mediciones
    /step3-review.tsx            # Paso 3: Revisión y envío
  /network-status.tsx            # Indicador de conectividad
  /recent-records.tsx            # Registros recientes
  /severity-indicator.tsx        # Visualizador de severidad
  /photo-capture.tsx             # Capturador de fotos
  /step-indicator.tsx            # Indicador de progreso
  /sync-service-provider.tsx     # Inicializador de sync
/lib
  /db.ts                         # Wrapper de IndexedDB
  /severity-calculator.ts        # Calculador IS
  /sync-service.ts               # Servicio de sincronización
  /geolocation.ts                # Utilidades GPS
  /radicado-generator.ts         # Generador de radicados
\`\`\`

## Instalación y Desarrollo

\`\`\`bash
# Instalar dependencias (automático en Next.js)
# No se requiere npm install

# Desarrollo
# La app se ejecuta automáticamente en el entorno v0

# Build para producción
# Se genera automáticamente al publicar en Vercel
\`\`\`

## Configuración de Variables de Entorno

Para integración con Microsoft, configure estas variables en Vercel:

### Opción 1: SharePoint List REST API
\`\`\`env
SHAREPOINT_SITE_URL=https://your-tenant.sharepoint.com/sites/your-site
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_TENANT_ID=your-tenant-id
\`\`\`

### Opción 2: Power Automate HTTP Trigger
\`\`\`env
POWER_AUTOMATE_WEBHOOK_URL=https://prod-xx.westus.logic.azure.com:443/workflows/...
NEXT_PUBLIC_PA_KEY=your-function-key
\`\`\`

### Opción 3: Azure Function
\`\`\`env
AZURE_FUNCTION_URL=https://your-function.azurewebsites.net/api/pqrs
AZURE_FUNCTION_KEY=your-function-key
\`\`\`

## Integración con Microsoft

### 1. SharePoint List

Cree una lista de SharePoint con estos campos:

| Campo | Tipo | Requerido |
|-------|------|-----------|
| Title | Texto (Radicado) | Sí |
| Tipo | Opción múltiple | Sí |
| Clasificacion | Opción múltiple | Sí |
| Latitud | Número | Sí |
| Longitud | Número | Sí |
| Direccion | Texto | Sí |
| Barrio | Texto | No |
| Comuna | Texto | No |
| Largo_m | Número | Sí |
| Ancho_m | Número | Sí |
| Profundidad_cm | Número | No |
| Area_m2 | Número | Sí |
| ExposicionPeaton | Número | Sí |
| ExposicionVehiculo | Número | Sí |
| VelocidadVia | Número | Sí |
| ProxEquipamientos | Número | Sí |
| SeveridadScore | Número | Sí |
| SeveridadNivel | Opción múltiple | Sí |
| SLA_Horas | Número | Sí |
| Responsable | Texto | Sí |
| Cuadrilla | Texto | No |
| Fotos | Texto múltiples líneas | No |
| Observaciones | Texto múltiples líneas | No |
| Estado | Opción múltiple | Sí |
| Timestamp | Fecha y hora | Sí |

### 2. Power Automate

Cree un flujo con trigger HTTP y agregue acciones para:
1. Recibir JSON desde la app
2. Crear item en SharePoint List
3. Subir fotos a biblioteca de documentos
4. Enviar notificaciones según severidad
5. Asignar tareas según SLA

### 3. Autenticación

Para producción, implemente autenticación con Azure AD:

\`\`\`typescript
// En app/api/pqrs/sync/route.ts
import { getToken } from '@azure/msal-node';

const authHeader = request.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');

// Validar token con Azure AD
const isValid = await validateAzureToken(token);
if (!isValid) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
\`\`\`

## Modelo de Datos

### PQRSRecord Interface

\`\`\`typescript
{
  id: string;                    // UUID generado localmente
  radicado: string;              // PQRS-YYYYMMDD-XXXXX
  tipo: 'Petición' | 'Queja' | 'Reclamo' | 'Sugerencia' | 'Denuncia';
  ubicacion: {
    lat: number;
    lon: number;
    direccion: string;
    barrio?: string;
    comuna?: string;
  };
  clasificacion: 'Calzada' | 'Andén' | 'Señalización' | 'Drenaje' | 'Espacio público' | 'Alumbrado' | 'Vegetación' | 'Otro';
  medicion: {
    largo_m: number;             // 0-100
    ancho_m: number;             // 0-100
    profundidad_cm?: number;     // 0-100
    area_m2: number;             // Calculado
  };
  riesgo: {
    exposicion_peaton: 0|1|2|3;
    exposicion_vehiculo: 0|1|2|3;
    velocidad_via: 0|1|2|3;
    prox_equipamientos: 0|1|2;
  };
  severidad: {
    score: number;               // 0-100
    nivel: 'Baja' | 'Media' | 'Alta';
    sla_estimado_h: number;      // 24, 72, o 168
  };
  evidencias: {
    fotos: string[];             // Base64 Data URLs
    video?: string;
  };
  operacion: {
    responsable: string;
    cuadrilla?: string;
    estado: 'Borrador' | 'Registrado' | 'Enviado' | 'Atendido';
  };
  observaciones?: string;        // max 1000 caracteres
  timestamp: string;             // ISO 8601
  form_version: string;          // '1.0'
  sync_state: 'local_only' | 'queued' | 'synced' | 'error';
}
\`\`\`

## Validaciones Implementadas

- ✅ Rango de mediciones: largo/ancho 0-100m, profundidad 0-100cm
- ✅ Coordenadas GPS obligatorias
- ✅ Fotos obligatorias para IS ≥ 40
- ✅ Responsable obligatorio
- ✅ Límite de 5 fotos por registro
- ✅ Máximo 1000 caracteres en observaciones

## Sincronización

### Estrategia de Reintentos
- Intervalo de sincronización: 30 segundos
- Máximo de reintentos: 5 intentos
- Backoff exponencial automático
- Persistencia de cola en IndexedDB

### Estados de Sincronización
- **local_only**: Solo guardado localmente
- **queued**: En cola de sincronización
- **synced**: Sincronizado exitosamente
- **error**: Error después de 5 intentos

## UX/UI Optimizado para Campo

- ✅ Targets táctiles ≥ 44px (WCAG AAA)
- ✅ Contraste alto para uso bajo sol
- ✅ Textos mínimo 16px
- ✅ Operación con una mano
- ✅ Indicadores de progreso claros
- ✅ Mensajes de error descriptivos
- ✅ Modo claro/oscuro automático
- ✅ Responsive mobile-first

## Accesibilidad

- ✅ Semantic HTML (main, header, nav)
- ✅ ARIA labels y roles
- ✅ Navegación por teclado
- ✅ Textos alternativos en imágenes
- ✅ Mensajes de error en español claro

## Seguridad

### Implementadas
- ✅ Validación de inputs (client + server)
- ✅ Rangos de valores seguros
- ✅ Sanitización de datos
- ✅ HTTPS obligatorio (Vercel)

### Pendientes para Producción
- ⚠️ Autenticación con Azure AD
- ⚠️ Roles y permisos (técnico, supervisor, admin)
- ⚠️ Cifrado de fotos en tránsito
- ⚠️ Rate limiting en API
- ⚠️ CORS configurado
- ⚠️ CSP headers

## Próximos Pasos (V1)

- [ ] Autenticación Azure AD
- [ ] Firma digital opcional
- [ ] Modo demo con datos precargados
- [ ] Exportar registros a Excel
- [ ] Dashboard de estadísticas
- [ ] Mapas con clustering de registros
- [ ] Múltiples afectaciones por punto
- [ ] Soporte para video
- [ ] Notificaciones push
- [ ] Modo offline indicator persistente

## Soporte

Para problemas o consultas:
- Email: soporte@medellin.gov.co
- Documentación: https://docs.pqrs-medellin.gov.co
- Helpdesk: +57 4 385 5555

## Licencia

© 2025 Alcaldía de Medellín. Todos los derechos reservados.

---

**Versión**: 1.0.0-MVP  
**Última actualización**: Enero 2025  
**Desarrollado con**: v0.app by Vercel
\`\`\`
