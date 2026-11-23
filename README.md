ESTA ES LA ESTRUCTURA QUE DEBE DE LLEVAR EL PROYECTO:
vle-app/
├── app.py                      # Servidor Flask: rutas de la API y de la página
├── wsgi.py                     # Punto de entrada para gunicorn (solo en el VPS)
├── requirements.txt            # flask, numpy, scipy, flask-compress, gunicorn
├── .gitignore                  # venv/, __pycache__/, .env
├── .env.example                # Variables de ejemplo (sin datos reales)
├── README.md                   # Cómo instalar y correr el proyecto
│
├── core/                       # La matemática, sin Flask ni pantalla
│   ├── antoine.py              # Presión de vapor y temperatura de ebullición (ln y log10)
│   ├── pxy.py                  # Diagrama P-xy y presiones de burbuja y rocío
│   ├── txy.py                  # Diagrama T-xy y temperaturas de burbuja y rocío (fsolve)
│   ├── unidades.py             # Las 4 tarjetas: unidades de entrada y de salida
│   └── tablas.py               # Carga las tablas y busca cada compuesto
│
├── data/
│   └── tablas/                 # Una tabla por tarjeta, tal cual las entregó el cliente
│       ├── kpa_celsius_b2.json
│       ├── bar_celsius_poling.json
│       ├── mmhg_celsius_unam.json
│       └── mmhg_kelvin_a2.json
│
├── tools/
│   └── importar_tablas.py      # Pasa las tablas del cliente a JSON (se usa una vez)
│
├── templates/
│   └── index.html              # La página
│
├── static/
│   ├── css/styles.css
│   └── js/
│       ├── api.js              # fetch al backend
│       ├── ui.js               # sidebar, tarjetas, tabla, aviso "No converge"
│       ├── plots.js            # gráficas con Plotly
│       └── main.js             # Une todo
│
└── tests/
    ├── test_antoine.py         # Comprueba contra los valores del script original
    ├── test_pxy.py
    └── test_txy.py
