# Ayuda de AblaufDiagramm

## Atajos de teclado

| Atajo | Acción |
| --- | --- |
| `Ctrl + Z` | Deshacer la última operación |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Rehacer la operación deshecha |
| `Ctrl + D` | Duplicar los nodos seleccionados, incluida la selección múltiple |
| `Delete` / `Backspace` | Eliminar nodos o relaciones seleccionados; se ignora dentro de campos de texto |
| `Ctrl + A` | Seleccionar todos los nodos de persona |
| `Ctrl + =` / `Ctrl + +` | Acercar |
| `Ctrl + -` | Alejar |
| `Escape` | Deseleccionar todo / cancelar una relación en curso |
| `Space + Drag` | Mantén Espacio y arrastra para mover el lienzo |
| `Mouse Wheel` | Zoom del lienzo (10% ~ 1000%) |
| `Ctrl + Click` | Selección múltiple / deseleccionar nodos individuales |
| `Drag on empty canvas` | Seleccionar varios nodos con un marco |

## Guía de uso

### Añadir nodos

1. Haz clic en `+` en la barra lateral compacta para crear un nuevo nodo de persona en el lienzo.
2. Selecciona un nodo y haz clic en `↳` en la barra lateral o en `+` en la barra contextual del nodo para crear un hijo debajo con una relación padre-hijo automática.
3. Selecciona un nodo y haz clic en `⇄` en la barra contextual del nodo para crear un cónyuge al lado con una relación de pareja automática.
4. La barra contextual del nodo también ofrece `⧉` para duplicar y `×` para eliminar el nodo.

### Seleccionar nodos y relaciones

1. Haz clic en un nodo para seleccionarlo; aparecerá un borde azul alrededor.
2. Haz clic en una relación para seleccionarla; el inspector contextual derecho mostrará sus propiedades.
3. Haz clic en una zona vacía del lienzo para limpiar la selección actual.
4. Mantén `Ctrl` mientras haces clic en nodos para seleccionar varios o deseleccionar uno.
5. Arrastra sobre una zona vacía del lienzo para seleccionar varios nodos con un marco.

### Crear relaciones

1. Pasa el cursor por el borde de un nodo para mostrar cuatro manejadores de conexión: arriba, abajo, izquierda y derecha.
2. Arrastra desde un manejador y suelta sobre el manejador de un nodo destino.
3. Antes de arrastrar, elige el tipo de relación en el menú `⇄` de la barra lateral: **Padre-hijo** o **Pareja**.
4. El color de la relación hereda el color personalizado del nodo origen; las relaciones seleccionadas se resaltan en azul.
5. Haz clic en una zona vacía del lienzo para cancelar una relación en curso.

### Inspector de propiedades

Cuando se selecciona un nodo, aparece el inspector contextual derecho y permite editar estas propiedades:

| Campo | Descripción |
| --- | --- |
| Avatar | Imagen incrustada a la izquierda; admite URL (http/https/data URI) o carga de imagen local |
| Título | Primera línea del nodo, mostrada en negrita |
| Subtítulo 1 | Segunda línea |
| Subtítulo 2 | Tercera línea |
| Identidad | Texto de identidad |
| Tiempo | Texto temporal |
| Información extra | Texto opcional adicional |
| Insignia | Texto opcional de la insignia circular superior derecha |
| Color del nodo | Color de fondo personalizado |
| Posición | X / Y del nodo en coordenadas del mundo del lienzo |

Cuando se selecciona una relación, puedes cambiar su tipo (Padre-hijo / Pareja) o eliminarla.

### Tamaños de nodo

- Los nodos sin avatar tienen tamaño fijo `180 × 100`.
- Los nodos con avatar tienen tamaño fijo `270 × 120`.
- Añadir, importar o editar un avatar siempre normaliza el nodo a uno de estos dos tamaños.

### Guardar y exportar

| Función | Descripción |
| --- | --- |
| Guardado automático | Guarda automáticamente en el almacenamiento local del navegador (localStorage) mientras editas |
| Exportar JSON | Exporta el proyecto actual como archivo `.json`, con nodos, relaciones, estado de vista y límites del lienzo |
| Importar JSON | Restaura un proyecto completo desde un archivo `.json` |
| Exportar PNG | Exporta todo el lienzo como imagen PNG |
| Exportar SVG | Exporta todo el lienzo como gráfico vectorial SVG |
| Exportar WebP | Exporta todo el lienzo en formato WebP |

La exportación de imagen usa un objeto fuera de pantalla. `html-to-image` no captura ni reescribe temporalmente el lienzo interactivo real, por lo que la exportación no debería mover visualmente el lienzo visible.

### Minimapa

- El minimapa de la esquina inferior derecha muestra una miniatura global del lienzo.
- El rectángulo azul indica el área visible actual.
- Arrastra el rectángulo azul para navegar rápidamente a cualquier posición.
- Haz clic en `-` / `+` para contraer o expandir el minimapa.

### Panel de zoom

- Haz clic en el porcentaje de la barra de herramientas para abrir el panel de zoom.
- Ajusta el zoom con botones `-` / `+`, deslizador o entrada directa de porcentaje (10% ~ 1000%).

### Redimensionar lienzo

- Haz clic en **Lienzo** en la barra superior para abrir directamente el panel de tamaño.
- Expande o reduce el límite del lienzo hacia arriba, abajo, izquierda o derecha.
- Configura el tamaño del paso para cada ajuste.

### Ajuste y alineación

- Los nodos pueden ajustarse automáticamente a intersecciones de la cuadrícula al arrastrar.
- También pueden alinearse con bordes o centros de nodos cercanos; se muestran guías naranjas.
- Puedes activar o desactivar esta función en Ajustes.

### Modo desarrollador

- El modo desarrollador se controla en el modal de ajustes y está activado por defecto.
- Cuando está activado, el menú **Vista** muestra **Ver lienzo clonado** y **CPP Status**.
- Cuando está activado, el inspector contextual muestra ID de bloques, ID de relaciones, ID de origen/destino e ID de relaciones conectadas.
- **CPP Status** muestra la salida de nodos, relaciones y diagnósticos de C++ GraphCore.
- **Ver lienzo clonado** muestra una vista previa en miniatura del lienzo clonado oculto.

### Diseño del editor

- La barra superior agrupa comandos en **Archivo**, **Editar**, **Vista**, **Lienzo**, Ajustes y Ayuda.
- La barra lateral compacta ofrece acciones rápidas para añadir nodos, añadir hijos, elegir tipo de relación y abrir estadísticas del grafo.
- La barra contextual del nodo aparece cuando hay un solo nodo seleccionado y ofrece añadir hijo, añadir cónyuge, duplicar y eliminar.
- El inspector derecho aparece solo al seleccionar un nodo o una relación; su ancho puede redimensionarse y se guarda automáticamente.

### Título del proyecto

- Haz doble clic en el título central de la barra de herramientas para renombrar el proyecto.
- Pulsa Enter para confirmar, Escape para cancelar.
- El título aparece en los nombres de archivo exportados.

## Tipos de nodo

| Tipo | Descripción |
| --- | --- |
| **Nodo de persona** | Nodo rectangular visible con título, subtítulos, identidad, tiempo, etc.; admite avatar, insignia y color personalizado |

## Consejos

- Todas las relaciones usan rutas ortogonales de ángulo recto y heredan el color del nodo origen.
- Haz clic en una zona vacía del lienzo para limpiar rápidamente el nodo o la relación seleccionados.
- Mantén `Ctrl` para seleccionar varios nodos individualmente; arrastra sobre una zona vacía para seleccionar con marco.
- Rango de zoom del lienzo: 10% ~ 1000%, con rueda del ratón, panel táctil o `Ctrl+=` / `Ctrl+-`.
- Los menús superiores ofrecen importar/exportar, deshacer/rehacer, eliminar, duplicar, ajustar vista, cuadrícula, cambio de tema y herramientas de desarrollador.
- Todos los ajustes tienen efecto inmediato y se guardan automáticamente.
