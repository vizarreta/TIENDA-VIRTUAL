"""Generate the course report about the verified frontend API integration."""

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output/pdf/informe-servicio-externo-frontend.pdf'
EVIDENCE = ROOT / 'docs/screenshots'
WIDTH, HEIGHT = A4
MARGIN = 46
CONTENT = WIDTH - 2 * MARGIN
INK = HexColor('#202c35')
TEAL = HexColor('#087e8b')
MUTED = HexColor('#52616b')
LIGHT = HexColor('#edf4f5')
PAGE_COUNT = 5


class Report:
    """Draw a fixed-page report, rejecting content outside its printable area."""

    def __init__(self, output: Path) -> None:
        output.parent.mkdir(parents=True, exist_ok=True)
        pdfmetrics.registerFont(TTFont('Arial', 'C:/Windows/Fonts/arial.ttf'))
        pdfmetrics.registerFont(TTFont('ArialBold', 'C:/Windows/Fonts/arialbd.ttf'))
        pdfmetrics.registerFont(TTFont('Consolas', 'C:/Windows/Fonts/consola.ttf'))
        pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='ArialBold')
        self.pdf = canvas.Canvas(str(output), pagesize=A4)
        self.pdf.setTitle('Consumo de un servicio externo desde el frontend')
        self.pdf.setAuthor('Proyecto Tienda Virtual')
        self.pdf.setSubject('Informe técnico: integración de ExchangeRate-API en React')
        self.y = 0

    def ensure_space(self, height: float) -> None:
        """Raise if the next block would collide with the page footer."""
        if self.y - height < 57:
            raise ValueError(f'Page overflow at y={self.y}, required={height}')

    def paragraph(self, text: str, size: float = 10.3, color=INK,
                  gap: float = 9, bold: bool = False,
                  x: float = MARGIN, width: float = CONTENT) -> None:
        """Draw wrapped report text with explicit width and spacing."""
        style = ParagraphStyle('body', fontName='ArialBold' if bold else 'Arial',
                               fontSize=size, leading=size * 1.4, textColor=color)
        block = Paragraph(text, style)
        _, height = block.wrap(width, HEIGHT)
        self.ensure_space(height)
        block.drawOn(self.pdf, x, self.y - height)
        self.y -= height + gap

    def page(self, number: int, title: str, subtitle: str) -> None:
        """Start a numbered A4 page with a consistent running header."""
        if number > 1:
            self.pdf.showPage()
        self.pdf.setFillColor(TEAL)
        self.pdf.rect(MARGIN, HEIGHT - 43, 28, 4, fill=1, stroke=0)
        self.pdf.setFont('ArialBold', 8)
        self.pdf.setFillColor(INK)
        self.pdf.drawString(MARGIN + 38, HEIGHT - 43, 'TIENDA VIRTUAL / INFORME TÉCNICO')
        self.pdf.setStrokeColor(HexColor('#d9e2e7'))
        self.pdf.line(MARGIN, 43, WIDTH - MARGIN, 43)
        self.pdf.setFont('Arial', 8)
        self.pdf.setFillColor(MUTED)
        self.pdf.drawString(MARGIN, 28, '26 de septiembre de 2026 | Proyecto del curso')
        self.pdf.drawRightString(WIDTH - MARGIN, 28, f'{number} / {PAGE_COUNT}')
        self.y = HEIGHT - 73
        self.paragraph(title, 23, gap=8, bold=True)
        self.paragraph(subtitle, 10, MUTED, gap=16)

    def section(self, title: str) -> None:
        """Draw a compact numbered section heading."""
        self.y -= 4
        self.paragraph(title, 12.5, TEAL, gap=8, bold=True)

    def code(self, lines: list[str], size: float = 8.2) -> None:
        """Draw readable code and reject unwrapped lines that exceed the column."""
        leading = size + 4
        height = len(lines) * leading + 20
        self.ensure_space(height)
        self.pdf.setFillColor(LIGHT)
        self.pdf.rect(MARGIN, self.y - height, CONTENT, height, fill=1, stroke=0)
        self.pdf.setFont('Consolas', size)
        self.pdf.setFillColor(INK)
        for index, line in enumerate(lines):
            if pdfmetrics.stringWidth(line, 'Consolas', size) > CONTENT - 24:
                raise ValueError(f'Code line too wide: {line}')
            self.pdf.drawString(MARGIN + 12, self.y - 17 - index * leading, line)
        self.y -= height + 11

    def table(self, headers: list[str], rows: list[tuple], widths: list[float]) -> None:
        """Draw a wrapped table with measured row heights."""
        for index, row in enumerate([headers] + rows):
            style = ParagraphStyle('cell', fontName='ArialBold' if index == 0 else 'Arial',
                                   fontSize=9, leading=12.3, textColor=white if index == 0 else INK)
            blocks = [Paragraph(escape(str(value)), style) for value in row]
            height = max(block.wrap(width - 16, HEIGHT)[1]
                         for block, width in zip(blocks, widths)) + 14
            self.ensure_space(height)
            self.pdf.setFillColor(TEAL if index == 0 else LIGHT if index % 2 else white)
            self.pdf.rect(MARGIN, self.y - height, CONTENT, height, fill=1, stroke=0)
            x = MARGIN
            for block, width in zip(blocks, widths):
                _, block_height = block.wrap(width - 16, HEIGHT)
                block.drawOn(self.pdf, x + 8, self.y - 7 - block_height)
                x += width
            self.y -= height
        self.y -= 12

    def architecture(self) -> None:
        """Draw the API integration boundaries without implying backend mediation."""
        height = 150
        self.ensure_space(height)
        top = self.y
        boxes = [
            (MARGIN, top - 49, 150, 45, 'CurrencyConverter', 'Vista e interacción'),
            (MARGIN + 176, top - 49, 150, 45, 'useExchangeRates', 'Consulta y caché'),
            (MARGIN, top - 128, 150, 45, 'conversion.ts', 'Reglas puras'),
            (MARGIN + 176, top - 128, 150, 45, 'exchange-rates.api', 'Fetch y validación'),
            (MARGIN + 350, top - 128, CONTENT - 350, 45, 'ExchangeRate-API', 'Proveedor externo'),
        ]
        for x, y, width, box_height, title, description in boxes:
            self.pdf.setFillColor(LIGHT)
            self.pdf.setStrokeColor(TEAL)
            self.pdf.rect(x, y, width, box_height, fill=1, stroke=1)
            self.pdf.setFillColor(INK)
            self.pdf.setFont('ArialBold', 9)
            self.pdf.drawCentredString(x + width / 2, y + 27, title)
            self.pdf.setFont('Arial', 8.5)
            self.pdf.drawCentredString(x + width / 2, y + 12, description)
        for x1, y1, x2, y2 in [
            (MARGIN + 150, top - 26, MARGIN + 176, top - 26),
            (MARGIN + 75, top - 49, MARGIN + 75, top - 83),
            (MARGIN + 251, top - 49, MARGIN + 251, top - 83),
            (MARGIN + 326, top - 105, MARGIN + 350, top - 105),
        ]:
            self.pdf.setStrokeColor(TEAL)
            self.pdf.line(x1, y1, x2, y2)
            if x1 == x2:
                self.pdf.line(x2, y2, x2 - 3, y2 + 5)
                self.pdf.line(x2, y2, x2 + 3, y2 + 5)
            else:
                self.pdf.line(x2, y2, x2 - 5, y2 - 3)
                self.pdf.line(x2, y2, x2 - 5, y2 + 3)
        self.y -= height

    def evidence(self) -> None:
        """Place existing execution captures, clipping only unused desktop whitespace."""
        desktop = ImageReader(str(EVIDENCE / 'servicio-externo-escritorio.png'))
        scale = CONTENT / 1024
        shown_height = 450 * scale
        self.ensure_space(shown_height)
        bottom = self.y - shown_height
        self.pdf.saveState()
        clip = self.pdf.beginPath()
        clip.rect(MARGIN, bottom, CONTENT, shown_height)
        self.pdf.clipPath(clip, stroke=0)
        self.pdf.drawImage(desktop, MARGIN, self.y - 800 * scale,
                           width=1280 * scale, height=800 * scale)
        self.pdf.restoreState()
        self.y = bottom - 8
        self.paragraph('Figura 1. Consulta real en español: 100 PEN = USD 29.35. '
                       'Recorte del área útil de la captura de escritorio.', 8.8, MUTED, gap=13)

        mobile = ImageReader(str(EVIDENCE / 'servicio-externo-movil.png'))
        width, height = mobile.getSize()
        image_height = 310
        image_width = width / height * image_height
        top = self.y
        self.ensure_space(image_height)
        self.pdf.drawImage(mobile, MARGIN, top - image_height,
                           width=image_width, height=image_height)
        text_x = MARGIN + image_width + 24
        text_width = CONTENT - image_width - 24
        self.paragraph('Figura 2. Vista móvil en portugués', 11, TEAL, bold=True,
                       x=text_x, width=text_width)
        self.paragraph('La prueba mostró <b>100 PEN = R$ 152,36</b>. El importe y la '
                       'moneda se conservan al cambiar de idioma.', x=text_x, width=text_width)
        self.paragraph('Se verificaron viewports de <b>1280 × 800</b> y '
                       '<b>390 × 844</b>, sin desplazamiento horizontal. '
                       'También se comprobó la interfaz en inglés.', x=text_x, width=text_width)
        self.paragraph('Fecha del dato mostrada en la aplicación: '
                       '<b>25 de septiembre de 2026, 19:02</b> (hora local). '
                       'Las tasas y resultados corresponden a esa ejecución; '
                       'no son valores fijos ni una oferta de cambio.', 9.4, MUTED,
                       x=text_x, width=text_width)
        self.y = min(self.y, top - image_height) - 12


def build_report() -> Path:
    """Return the generated PDF path using source code and recorded test evidence."""
    report = Report(OUTPUT)
    report.page(1, 'Consumo de un servicio externo<br/>desde el frontend',
                'Integración de ExchangeRate-API en la aplicación Tienda Virtual')
    report.section('1. Introducción')
    report.paragraph('Una aplicación web puede incorporar información de un proveedor externo '
                     'sin almacenar todos esos datos en su propia base de datos. En Tienda '
                     'Virtual se implementó un conversor de monedas que consulta una API '
                     'pública desde el navegador y presenta una estimación al usuario.')
    report.section('2. Objetivo y alcance')
    report.paragraph('<b>Objetivo general:</b> consumir un servicio externo mediante una '
                     'solicitud HTTP desde el frontend, procesar su respuesta y utilizarla '
                     'en una funcionalidad de la aplicación.')
    report.paragraph('<b>Aplicación concreta:</b> convertir un importe en soles peruanos '
                     '(PEN) a dólares estadounidenses (USD), euros (EUR) o reales brasileños '
                     '(BRL). La ruta <b>/currency</b> es pública y se abre desde el menú '
                     '<b>Conversor</b>. Los precios y pedidos permanecen en PEN; el cálculo '
                     'es orientativo y no incluye comisiones.')
    report.section('3. Servicio seleccionado')
    report.table(['Característica', 'Decisión implementada'], [
        ('Proveedor', 'ExchangeRate-API, modalidad Open Access [1].'),
        ('Método y recurso', 'GET https://open.er-api.com/v6/latest/PEN'),
        ('Autenticación y formato', 'Sin API key; respuesta en formato JSON.'),
        ('Actualización y condiciones', 'Datos diarios, límite de consultas y atribución visible [1].'),
        ('Cliente de la solicitud', 'Fetch del navegador; no pasa por NestJS ni por /api.'),
    ], [150, CONTENT - 150])
    report.section('4. Herramientas empleadas')
    report.paragraph('<b>React y TypeScript:</b> vista y contratos. <b>Fetch y AbortController:</b> '
                     'solicitud y cancelación. <b>TanStack Query:</b> carga y caché. '
                     '<b>i18next:</b> textos en español, inglés y portugués. '
                     '<b>Intl.NumberFormat:</b> presentación monetaria. Se reutilizan '
                     'las dependencias existentes del proyecto.')

    report.page(2, 'Arquitectura e implementación',
                'Separación entre presentación, estado, reglas y comunicación externa')
    report.section('5. Organización por componentes')
    report.architecture()
    report.paragraph('Las flechas representan dependencias. Los cuatro primeros bloques '
                     'se ejecutan en el navegador; el último pertenece al proveedor. '
                     'NestJS y SQLite siguen atendiendo las funciones internas de la tienda '
                     'y no intervienen en esta consulta.')
    report.code([
        'frontend/src/',
        '  components/CurrencyConverter.tsx',
        '  modules/currency/useExchangeRates.ts',
        '  modules/currency/conversion.ts',
        '  services/exchange-rates.api.ts',
        '  locales/{es,en,pt}.json',
    ])
    report.section('6. Solicitud HTTP y lectura de la respuesta')
    report.paragraph('Fragmento del adaptador <b>getExchangeRates</b>. La función completa '
                     'añade timeout, cancelación y manejo de errores mediante '
                     '<b>ExchangeRatesError</b>. No se utiliza el cliente Axios interno.')
    report.code([
        'const response = await fetch(EXCHANGE_RATES_URL, {',
        '  signal: controller.signal,',
        "  credentials: 'omit',",
        "  referrerPolicy: 'no-referrer',",
        "  headers: { Accept: 'application/json' },",
        '});',
        'if (!response.ok) {',
        '  throw new ExchangeRatesError(',
        "    response.status === 429 ? 'rateLimit' : 'unavailable'",
        '  );',
        '}',
        'const payload: unknown = await response.json();',
        'return parseExchangeRates(payload);',
    ])
    report.paragraph('El adaptador exige <b>result = success</b>, base <b>PEN</b>, '
                     'fechas válidas y tasas numéricas positivas. Conserva USD, EUR y BRL, '
                     'y transforma las fechas Unix de segundos a milisegundos. '
                     'La validación en ejecución complementa los tipos TypeScript.', 9.8)

    report.page(3, 'Funcionamiento y calidad',
                'Validación de entradas, privacidad y resultados de pruebas')
    report.section('7. Flujo de datos y cálculo')
    report.paragraph('Al abrir el conversor, <b>useExchangeRates</b> solicita las tasas y '
                     'mantiene una caché en memoria de una hora. La recarga del navegador '
                     'pierde esa caché. No hay sondeo de red ni reintento automático. '
                     'Cambiar importe, idioma o moneda destino reutiliza la respuesta.')
    report.code([
        'importeConvertido = importeEnPEN * tasaDestino;',
        r'const AMOUNT_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;',
    ])
    report.paragraph('Se aceptan importes entre 0 y 1 000 000, con hasta dos decimales '
                     'y separador punto o coma. Un valor inválido no produce una conversión. '
                     'El formato final muestra dos decimales; la operación es O(1). '
                     'Un reloj local revisa la advertencia de antigüedad sin consultar la API.')
    report.section('8. Seguridad y manejo de fallos')
    report.paragraph('La solicitud utiliza HTTPS, omite cookies y no envía referrer. '
                     'No transmite JWT, sesión del carrito, importe ingresado ni datos '
                     'de clientes. El proveedor recibe la IP del navegador. '
                     'El acceso depende del CORS habilitado por el proveedor.')
    report.table(['Situación', 'Comportamiento implementado'], [
        ('Respuesta tarda más de 10 s', 'Cancela la solicitud y muestra un mensaje de timeout.'),
        ('HTTP 429 / otros errores HTTP', 'Indica límite de consultas o indisponibilidad, con reintento manual.'),
        ('Red o JSON inválido', 'Muestra un error traducido; no inventa tasas ni sustituye el error por cero.'),
        ('Datos previos o antiguos', 'Conserva la referencia disponible con advertencia cuando corresponde.'),
    ], [155, CONTENT - 155])
    report.section('9. Verificación automatizada')
    report.paragraph('<b>39 pruebas aprobadas:</b> 19 de backend y 20 de frontend. '
                     'Diez de las pruebas frontend cubren esta integración: contrato, '
                     'ausencia de credenciales, errores HTTP y JSON, timeout, cancelación, '
                     'traducciones, límites y cálculo. Se encuentran en '
                     '<b>frontend/test/exchange-rates.test.cjs</b>.')
    report.paragraph('La compilación de los workspaces finalizó correctamente y el lint '
                     'del módulo pasó. Vite conserva una advertencia no bloqueante por '
                     'el tamaño del bundle. Las pruebas de fallos usan mocks: no '
                     'demuestran disponibilidad permanente del proveedor ni se simuló '
                     'una caída real durante la revisión visual.', 9.5, MUTED)

    report.page(4, 'Evidencias de ejecución',
                'Capturas reales del proyecto, obtenidas el 26 de septiembre de 2026')
    report.evidence()

    report.page(5, 'Reproducción y conclusiones',
                'Guía de demostración y referencias del trabajo')
    report.section('10. Cómo comprobar el requisito')
    report.paragraph('Desde la raíz del repositorio, con las dependencias y la '
                     'configuración local del proyecto disponibles:')
    report.code(['npm run dev', 'npm test', 'npm run build'])
    report.paragraph('1. Abrir <b>http://localhost:5173/currency</b> o el puerto que '
                     'indique Vite; también se puede usar el enlace <b>Conversor</b>.')
    report.paragraph('2. Ingresar <b>100</b> y alternar USD, EUR y BRL. '
                     'Comprobar resultado, fecha del tipo de cambio y atribución.')
    report.paragraph('3. Ingresar <b>12,50</b>, luego <b>-1</b> y <b>1.234</b>. '
                     'Los dos últimos deben mostrar error. Cambiar el idioma para '
                     'comprobar la traducción de etiquetas y mensajes.')
    report.paragraph('4. En DevTools &gt; Network, localizar <b>open.er-api.com</b>. '
                     'Verificar el destino HTTPS y la ausencia de Authorization y '
                     'x-session-id. Esta es una comprobación reproducible del consumo '
                     'directo desde el frontend.')
    report.section('11. Conclusiones y limitaciones')
    report.paragraph('El requisito se cumple: el navegador obtiene datos de un servicio '
                     'externo, valida la respuesta y la convierte en una función útil '
                     'para la tienda. La separación en módulos permite cambiar el '
                     'proveedor sin reescribir las reglas del conversor ni el carrito.')
    report.paragraph('La funcionalidad es referencial: no procesa pagos ni altera pedidos. '
                     'Depende de conectividad, CORS, disponibilidad y límites del proveedor. '
                     'La caché no persiste entre recargas. Como mejora futura puede '
                     'evaluarse una caché persistente con expiración explícita y pruebas '
                     'de interfaz automatizadas para los estados de error.')
    report.section('12. Fuentes y archivos de respaldo')
    report.paragraph('[1] ExchangeRate-API. <b>Open Access Endpoint</b>. Documentación '
                     'oficial consultada el 26/09/2026.<br/>'
                     '<link href="https://www.exchangerate-api.com/docs/free" color="#087e8b">'
                     'https://www.exchangerate-api.com/docs/free</link>', 9.5)
    report.paragraph('[2] Código fuente local: <b>frontend/src/services/exchange-rates.api.ts</b>, '
                     '<b>frontend/src/modules/currency/</b> y '
                     '<b>frontend/src/components/CurrencyConverter.tsx</b>.', 9.5)
    report.paragraph('[3] Documentación y evidencias del proyecto: '
                     '<b>docs/servicio-externo.md</b>, <b>docs/diagrama-componentes.md</b> '
                     'y capturas <b>docs/screenshots/servicio-externo-*.png</b>. '
                     'Resultados de ejecución y pruebas registrados en la implementación '
                     'del 26/09/2026.', 9.5)
    report.pdf.save()
    return OUTPUT


if __name__ == '__main__':
    print(build_report())
