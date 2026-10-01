# TASKMASTER POS - Suite Documental de Arquitectura & Modelado UML (27 Diagramas)

Rama dedicada para despliegue estático continuo en **Netlify**, **Cloudflare Pages** o **GitHub Pages**.

## Contenido de la Suite (100% Validada en Mermaid.js):
1. **01 (ARQ-01):** Diagrama de Arquitectura del Sistema (Monolito Modular Multi-Tenant en Capas)
2. **02 (ERD-01):** Diagrama Entidad-Relación Completo (PostgreSQL Multi-Tenant: public + tenant_{slug})
3. **03 (UML-01):** Casos de Uso: Operación de Terminal POS & Cobro en Mostrador
4. **04 (UML-02):** Casos de Uso: Aprovisionamiento Multi-Tenant & Onboarding
5. **05 (UML-03):** Casos de Uso: Facturación Fiscal SOAP & Consulta WSDL
6. **06 (UML-04):** Diagrama de Clases: Dominio Multi-Tenant & Aprovisionamiento
7. **07 (UML-05):** Diagrama de Clases: Módulo de Facturación & Comprobantes
8. **08 (UML-06):** Diagrama de Clases: Módulo de Catálogo & Caché en Memoria
9. **09 (UML-07):** Diagrama de Clases: Seguridad, Autenticación & RBAC
10. **10 (UML-08):** Diagrama de Paquetes: Arquitectura Modular Hexagonal
11. **11 (UML-09):** Diagrama de Componentes: Frontend React SPA & Hooks
12. **12 (UML-10):** Diagrama de Despliegue: Infraestructura Cloud & Multi-Región
13. **13 (UML-11):** Diagrama de Secuencia: Autenticación & Resolución de Inquilino
14. **14 (UML-12):** Diagrama de Secuencia: Emisión de Venta POS & Descuento de Stock
15. **15 (UML-13):** Diagrama de Secuencia: Transacción Resiliente Offline & Auto-Sync
16. **16 (UML-14):** Diagrama de Secuencia: Consulta y Validación Fiscal SOAP
17. **17 (UML-15):** Diagrama de Secuencia: Aprovisionamiento Automático de Schema
18. **18 (UML-16):** Diagrama de Secuencia: Actualización Modular a la Carta
19. **19 (UML-17):** Diagrama de Actividades: Flujo Integral de Cobro en Terminal POS
20. **20 (UML-18):** Diagrama de Actividades: Flujo de Aprovisionamiento de Inquilino
21. **21 (UML-19):** Diagrama de Actividades: Gestión y Reabastecimiento de Inventario
22. **22 (UML-20):** Diagrama de Actividades: Consulta y Auditoría de Comprobantes
23. **23 (UML-21):** Diagrama de Estados: Ciclo de Vida del Comprobante Fiscal
24. **24 (UML-22):** Diagrama de Estados: Conectividad y Cola Offline en POS
25. **25 (UML-23):** Diagrama de Estados: Sesión de Usuario & Contexto de Inquilino
26. **26 (UML-24):** Diagrama de Comunicación / Colaboración: Emisión de Venta
27. **27 (UML-25):** Diagrama de Perfil de Seguridad y Aislamiento Perimetral

## Despliegue en Netlify:
- **Branch to deploy:** `docs/architecture-uml`
- **Build command:** *(dejar vacío)*
- **Publish directory:** `.` *(raíz)*
