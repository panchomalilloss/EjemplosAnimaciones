# 🎮 Proyecto 3D con Three.js + Ammo.js  
### Jenga Físico + Bolera 3D

Este repositorio contiene **dos experiencias 3D interactivas** desarrolladas con **Three.js** para la visualización y **Ammo.js** como motor físico realista:

- 🧱 **Jenga Físico**: un juego de jenga totalmente funcional con físicas reales y bloques arrastrables con el ratón.  
- 🎳 **Bolera 3D**: un minijuego de bolos con una flecha de apuntado futurista, barra de potencia y física de impulso.

Ambos proyectos comparten el mismo entorno tecnológico y pueden ejecutarse por separado dentro del mismo repositorio.

---

## 🚀 Tecnologías utilizadas

- **Three.js** — Renderizado 3D en WebGL  
- **Ammo.js (ammojs-typed)** — Motor físico basado en Bullet Physics  
- **OrbitControls** — Control de cámara interactiva  
- **JavaScript ES Modules**  
- **HTML / CSS** — Elementos UI (barra de potencia)

---

# 🧱 Jenga Físico

Simulación completa de una torre Jenga con **fricción realista**, **bloques apilados correctamente** y la posibilidad de agarrar piezas con el ratón mediante una **restricción P2P (Point2Point) de Ammo.js**.

### ✨ Características

- Torre generada por niveles alternados (como un Jenga real).
- Agarre y arrastre de bloques con el ratón usando raycasting.
- Colisiones precisas y fricción aumentada para estabilidad.
- Cámara orbital ajustable.
- Suelo físico ampliado y torre más grande para mayor realismo.
- Simulación continua con `stepSimulation`.

### 🎮 Controles

| Acción | Entrada |
|-------|---------|
| Seleccionar / arrastrar bloque | Clic izquierdo + mover |
| Soltar bloque | Soltar clic izquierdo |
| Rotar / mover cámara | Arrastrar con OrbitControls |
| Zoom | Rueda del ratón |

---

# 🎳 Bolera 3D

Una experiencia de bolos donde el jugador **apunta**, **carga potencia**, y **lanza la bola** con impulso físico real.

### ✨ Características

- Flecha futurista oscilante indicando dirección.
- Barra de potencia dinámica con colores degradados.
- Bolos generados con cilindros físicos.
- Calle de bolera extensa y bola con masa realista.
- Impulso aplicado con dirección + potencia acumulada.
- Físicas completas con caída y colisiones entre bolos.

### 🎮 Controles

| Acción | Entrada |
|-------|---------|
| Iniciar carga de potencia | Mantener **barra espaciadora** |
| Aumentar potencia | Mantener **barra espaciadora** |
| Lanzar bola | Soltar **barra espaciadora** |
| Mover cámara | OrbitControls |
| Zoom | Rueda del ratón |

---

## 🛠️ Archivos principales

Este proyecto incluye dos demos independientes, cada una ubicada en su propia carpeta:

### ✔️ jenga.js  
Contiene toda la lógica del Jenga:
- Configuración de Three.js  
- Configuración física con Ammo.js  
- Construcción de la torre  
- Sistema de arrastre con interacción tipo "drag"  
- Sincronización entre mundo físico y render  
- Bucle de animación  

### ✔️ bowling.js  
Incluye:
- Pista, bolos y bola con físicas mediante Ammo.js  
- Flecha oscilante para apuntar  
- Barra de potencia para el disparo  
- Sistema de lanzamiento con impulso  
- Detección básica de colisiones  
- Actualización de físicas y render  

---

## 💡 Mejoras futuras sugeridas

- Menú UI para seleccionar entre Jenga y Bolera  
- Sistema de puntuaciones en la bolera  
- Efectos de sonido al colisionar  
- Materiales avanzados o texturas realistas  
- Optimización de físicas y batch rendering  
- Guardado de puntuaciones usando localStorage  
- Compatibilidad móvil (touch drag + swipe)  

---

## 📜 Licencia

Este proyecto es libre para uso personal y educativo.  
Puedes modificarlo, adaptarlo y distribuirlo libremente.
