# ScreenNotes 📌

<div align="center">

  **Un compañero de productividad de escritorio ultraligero, minimalista y siempre a la vista.**

  [![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Rust](https://img.shields.io/badge/Backend-Rust-dea584?logo=rust&logoColor=black)](https://www.rust-lang.org/)
  [![Release](https://img.shields.io/github/v/release/CrisChuquiruna/ScreenNotes?color=success&label=Versi%C3%B3n)](https://github.com/CrisChuquiruna/ScreenNotes/releases/latest)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

  <br />

  <!-- Espacio para agregar un screenshot o GIF de la app -->
  <!-- ![ScreenNotes Preview](./public/preview.png) -->

</div>

---

## 💡 ¿Qué es ScreenNotes?

**ScreenNotes** es una aplicación de escritorio diseñada para profesionales, programadores y creativos que necesitan gestionar sus notas rápidas, bloques de tiempo y eventos sin romper su flujo de trabajo.

A diferencia de las alternativas tradicionales construidas sobre Electron que consumen cientos de megabytes de RAM, ScreenNotes aprovecha la arquitectura moderna de **Tauri v2** y **Rust** para ofrecer un instalador ultra compacto (**~2.8 MB**) con un consumo de recursos prácticamente imperceptible.

---

## 📥 Descarga e Instalación

Puedes descargar la última versión compilada directamente desde [**GitHub Releases**](https://github.com/CrisChuquiruna/ScreenNotes/releases/latest):

| Sistema Operativo | Formato | Tamaño | Descripción / Uso |
| :--- | :---: | :---: | :--- |
| **Windows** | [`.exe`](https://github.com/CrisChuquiruna/ScreenNotes/releases/latest) | **~2.8 MB** | **Recomendado.** Asistente de instalación estándar (NSIS) con accesos directos. |
| **Windows** | [`.msi`](https://github.com/CrisChuquiruna/ScreenNotes/releases/latest) | ~3.9 MB | Paquete Windows Installer para despliegues o entornos corporativos. |
| **Linux (Ubuntu / Debian / Mint)** | [`.deb`](https://github.com/CrisChuquiruna/ScreenNotes/releases/latest) | ~4.4 MB | Paquete nativo de instalación (`sudo dpkg -i ...deb`). |
| **Linux (Universal Portable)** | [`.AppImage`](https://github.com/CrisChuquiruna/ScreenNotes/releases/latest) | ~79 MB | Portable para cualquier distribución sin instalar dependencias (`chmod +x`). |
| **Linux (Fedora / RHEL / openSUSE)** | [`.rpm`](https://github.com/CrisChuquiruna/ScreenNotes/releases/latest) | ~4.4 MB | Paquete nativo para distribuciones basadas en RPM (`sudo rpm -i ...rpm`). |
| **macOS** | `.dmg` | — | *(En proceso de distribución CI/CD)* |

---

## ✨ Características Principales

### 📝 Notas con Markdown
- Editor fluido con soporte para formato **Markdown** (listas, encabezados, bloques de código).
- Organización visual rápida mediante **códigos de color** (*slate, amber, emerald, violet, rose, sky*).
- Persistencia inmediata y navegación sencilla entre notas activas.

### 🎯 Rutinas Diarias y Time Blocking
- Planificador por días de la semana con **enfoque temático diario** (ej. *Desarrollo*, *Diseño 3D*, *Planificación*).
- Creación y seguimiento de **bloques de tiempo** (ej. `09:00 - 12:00`) con listas de verificación (*to-do checklist*).

### 📅 Integración con Calendario (Google Calendar)
- Vista unificada de eventos y compromisos diarios.
- Conexión e integración con **Google Calendar API** para sincronizar reuniones y entregas en tiempo real.

### 🪶 Experiencia de Usuario Minimalista
- Ventana translúcida sin bordes molestos del sistema operativo (*frameless* con barra de título personalizada).
- Posibilidad de mantener la ventana siempre flotante y accesible en tu espacio de trabajo.
- Modo oscuro moderno y limpio estilizado con **Tailwind CSS v4**.

---

## ⚡ ¿Por qué Tauri sobre Electron?

| Métrica | Alternativa típica (Electron) | ScreenNotes (Tauri v2) |
| :--- | :---: | :---: |
| **Tamaño del instalador** | ~80 MB – 150 MB | **~2.84 MB** |
| **Uso de memoria RAM** | 150 MB – 300 MB | **~25 MB – 40 MB** |
| **Backend** | Node.js empaquetado | **Rust nativo** |
| **Motor Web** | Chromium embebido | **Webview nativo del OS** |

---

## 🛠️ Stack Tecnológico

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Markdown:** `react-markdown` + `remark-gfm`
- **Backend de Escritorio:** [Tauri v2](https://tauri.app/) (Rust)
- **APIs & Conectividad:** `tauri-plugin-http`, `reqwest` con TLS nativo
- **CI/CD:** GitHub Actions Matrix Build (Windows, Ubuntu, macOS)

---

## 🚀 Desarrollo Local

Si deseas clonar el proyecto y contribuir o modificarlo:

### Prerrequisitos

1. **Node.js** (v18+ recomendado)
2. **Rust** y `cargo` (instalar vía [rustup.rs](https://rustup.rs/))
3. Dependencias del sistema de Tauri según tu sistema operativo ([Guía oficial de Tauri](https://v2.tauri.app/start/prerequisites/))

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/CrisChuquiruna/ScreenNotes.git
   cd ScreenNotes
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo (Hot-Reload):**
   ```bash
   npm run tauri dev
   ```

4. **Compilar instaladores localmente:**
   ```bash
   npm run tauri build
   ```

---

## 📦 Plataformas Soportadas

- [x] **Windows** (`.exe`, `.msi`)
- [x] **Linux** (`.deb`, `.rpm`, `.AppImage`)
- [ ] **macOS** (`.dmg`, `.app` — Apple Silicon & Intel) *(En proceso)*

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

<div align="center">
  Hecho con ❤️ por <b>Cristian Chuquiruna</b> • <a href="https://www.linkedin.com/in/crischuquiruna/">LinkedIn</a>
</div>
