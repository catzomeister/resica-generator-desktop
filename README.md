# Resica Generator Desktop

Really Simple Catalog (Resica) Generator is an electron app for generating PDF catalogs.

## Description

The GUI is based on filesystem directory tree and drag and drop operations.  The catalogs are simply defined by the following elements: 
* main directory (company name)
* catalog directories (versions)
* group directories (categories)
* image files (items)

```
company name/
├─ version 2020/
│  ├─ category A/
│  │  ├─ item01.png
│  │  ├─ item02.png
│  │  ├─ item03.png
│  ├─ category B/
│  │  ├─ item04.jpg
│  │  ├─ item05.jpg
├─ version 2021/
│  ├─ category A/
│  │  ├─ item01.jpg
│  │  ├─ item02.jpg
│  │  ├─ item03.jpg
│  │  ├─ item06.jpg
│  ├─ category B/
│  │  ├─ item04.jpg
│  │  ├─ item05.jpg
│  │  ├─ item07.jpg
│  ├─ category C/
│  │  ├─ item08.jpg
│  │  ├─ item09.jpg
```

Once the directory tree is completed with all the elements, it is necessary to record the information for each element, for which each element must be dragged and dropped in the left side of the app window.

To print the PDF catalog, you must select a specific version (using drag and drop).

## Getting Started

### Dependencies

* Git, NodeJs and NPM are required
* Supported operating systems: Windows, Linux and MacOs

### Installing

* Clone the repo
```
git clone https://github.com/catzomeister/resica-generator-desktop.git
```
* Install the dependencies
```
npm install
```

### Executing program

* Run with npm
```
npm start
```

## Authors

Johann Pinargote (catzomeister@outlook.com)

## License

This project is licensed under the MIT License.