# Resica Generator Desktop

Really Simple Catalog (Resica) Generator es una aplicación electrón para generar catálogos PDF.

## Descripción

La interfaz de usuario está basada en el árbol de de directorios del sistema de archivos y operaciones drag and drop.  Los catálogos son simplemente definidos por los siguientes elementos:
* directorio principal (nombre de compañía)
* directorios de catálogos (versiones)
* directorios de grupos (categorías)
* archivos de imagen (ítems)

```
nombre de compañía/
├─ versión 2020/
│  ├─ categoría A/
│  │  ├─ item01.png
│  │  ├─ item02.png
│  │  ├─ item03.png
│  ├─ categoría B/
│  │  ├─ item04.jpg
│  │  ├─ item05.jpg
├─ versión 2021/
│  ├─ categoría A/
│  │  ├─ item01.jpg
│  │  ├─ item02.jpg
│  │  ├─ item03.jpg
│  │  ├─ item06.jpg
│  ├─ categoría B/
│  │  ├─ item04.jpg
│  │  ├─ item05.jpg
│  │  ├─ item07.jpg
│  ├─ categoría C/
│  │  ├─ item08.jpg
│  │  ├─ item09.jpg
```

Una vez el árbol de directorios es completado con todos los elementos, es necesario guardar la información para cada elemento, para lo cual cual cada elemento debe ser arrastrado y soltado en la parte izquierda de la ventana de la app.

Para imprimir el catálogo PDF, se debe seleccionar una versión específica. (Utilizando drag and drop)

## Empezando

### Dependencias

* Git, NodeJs y NPM son requeridos
* Sistemas operativos soportados: Windows, Linux y MacOs

### Instalación

* Clonar el repositorio
```
git clone https://github.com/catzomeister/resica-generator-desktop.git
```
* Instalar las dependencias
```
npm install
```

### Ejecutar el programa

* Ejectura con npm
```
npm start
```

## Autores

Johann Pinargote (catzomeister@outlook.com)

## Licencia

Este proyecto se encuentra licenciado bajo la licencia MIT.