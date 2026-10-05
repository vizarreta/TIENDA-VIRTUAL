"""Build the course report from verified implementation and execution evidence."""

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output/pdf/informe-i18n-validacion-regex.pdf'
EVIDENCE = ROOT / 'docs/screenshots/informe'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Arial', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold', 'C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFont(TTFont('Consolas', 'C:/Windows/Fonts/consola.ttf'))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='ArialBold')

WIDTH, HEIGHT = A4
MARGIN = 48
CONTENT = WIDTH - 2 * MARGIN
INK = HexColor('#202b34')
TEAL = HexColor('#087e8b')
MUTED = HexColor('#52616b')
LIGHT = HexColor('#eef5f6')
PDF = canvas.Canvas(str(OUTPUT), pagesize=A4)
PDF.setTitle('Tienda Virtual: internacionalización y validación mediante regex')
PDF.setAuthor('Proyecto Tienda Virtual')
PDF.setSubject('Informe técnico de implementación y verificación del proyecto del curso')
Y = 0


def paragraph(text, size=10.5, color=INK, gap=9, bold=False, x=MARGIN, width=CONTENT):
    """Draw a wrapped paragraph, asserting that it stays inside the printable area."""
    global Y
    style = ParagraphStyle('body', fontName='ArialBold' if bold else 'Arial',
                           fontSize=size, leading=size * 1.42, textColor=color)
    block = Paragraph(text, style)
    _, height = block.wrap(width, HEIGHT)
    if Y - height < 55:
        raise ValueError(f'Page overflow: {text[:70]}')
    block.drawOn(PDF, x, Y - height)
    Y -= height + gap


def section(title):
    global Y
    Y -= 6
    paragraph(title, 13, TEAL, 9, True)


def page(number, title, subtitle):
    global Y
    if number > 1:
        PDF.showPage()
    PDF.setFillColor(TEAL)
    PDF.rect(MARGIN, HEIGHT - 44, 34, 4, fill=1, stroke=0)
    PDF.setFont('ArialBold', 8)
    PDF.drawString(MARGIN + 44, HEIGHT - 44, 'TIENDA VIRTUAL / INFORME DEL PROYECTO')
    PDF.setStrokeColor(HexColor('#d9e2e7'))
    PDF.line(MARGIN, 42, WIDTH - MARGIN, 42)
    PDF.setFont('Arial', 8)
    PDF.setFillColor(MUTED)
    PDF.drawString(MARGIN, 28, '19 de septiembre de 2026 · Implementación y pruebas locales')
    PDF.drawRightString(WIDTH - MARGIN, 28, f'{number} / 6')
    Y = HEIGHT - 77
    paragraph(title, 23, INK, 8, True)
    paragraph(subtitle, 10, MUTED, 19)


def code(lines, size=8):
    global Y
    height = len(lines) * (size + 5) + 20
    if Y - height < 55:
        raise ValueError('Code block overflows page')
    PDF.setFillColor(LIGHT)
    PDF.rect(MARGIN, Y - height, CONTENT, height, fill=1, stroke=0)
    PDF.setFont('Consolas', size)
    PDF.setFillColor(INK)
    for index, line in enumerate(lines):
        if pdfmetrics.stringWidth(line, 'Consolas', size) > CONTENT - 24:
            raise ValueError(f'Code line too wide: {line}')
        PDF.drawString(MARGIN + 12, Y - 16 - index * (size + 5), line)
    Y -= height + 12


def table(headers, rows, widths):
    global Y
    for index, row in enumerate([headers] + rows):
        style = ParagraphStyle('cell', fontName='ArialBold' if index == 0 else 'Arial',
                               fontSize=9, leading=12, textColor=white if index == 0 else INK)
        blocks = [Paragraph(escape(str(value)), style) for value in row]
        height = max(block.wrap(width - 16, HEIGHT)[1] for block, width in zip(blocks, widths)) + 16
        if Y - height < 55:
            raise ValueError('Table overflows page')
        PDF.setFillColor(TEAL if index == 0 else LIGHT if index % 2 else white)
        PDF.rect(MARGIN, Y - height, CONTENT, height, fill=1, stroke=0)
        x = MARGIN
        for block, width in zip(blocks, widths):
            _, block_height = block.wrap(width - 16, HEIGHT)
            block.drawOn(PDF, x + 8, Y - 8 - block_height)
            x += width
        Y -= height
    Y -= 13


def image(name, max_height, caption):
    global Y
    reader = ImageReader(str(EVIDENCE / name))
    width, height = reader.getSize()
    scale = min(CONTENT / width, max_height / height)
    draw_width, draw_height = width * scale, height * scale
    PDF.drawImage(reader, MARGIN + (CONTENT - draw_width) / 2, Y - draw_height,
                  width=draw_width, height=draw_height)
    Y -= draw_height + 10
    paragraph(caption, 9, MUTED, 14)


page(1, 'Internacionalización y\nvalidación con regex'.replace('\n', '<br/>'),
     'Informe técnico · Proyecto del curso: Tienda Virtual')
paragraph('El proyecto incorpora un menú desplegable para seleccionar el idioma de la interfaz '
          'y un formulario de registro validado mediante expresiones regulares. Este informe '
          'describe el código existente, las correcciones realizadas y la evidencia obtenida al ejecutarlo.')
section('1. Objetivo y alcance')
paragraph('Permitir que el usuario seleccione español, inglés o portugués y reciba mensajes '
          'de validación en ese idioma. El formulario revisa nombre completo, correo electrónico '
          'y contraseña antes de llamar a la API. El backend vuelve a validar el registro.')
table(['Requisito del trabajo', 'Implementación verificada'], [
    ('Menú desplegable de idioma', 'Opciones es, en y pt en la barra de navegación.'),
    ('Internacionalización', 'Claves de traducción, diccionarios JSON y persistencia de la selección.'),
    ('Validación mediante regex', 'Patrones centralizados para nombre, correo y contraseña.'),
    ('Evidencia de funcionamiento', 'Capturas de errores en tres idiomas, recarga y pruebas automatizadas.'),
], [180, CONTENT - 180])
section('2. Herramientas utilizadas')
paragraph('<b>Frontend:</b> React, TypeScript, Vite, Tailwind CSS, i18next y react-i18next. '
          '<b>Backend:</b> NestJS, class-validator, class-transformer, Prisma y SQLite. '
          '<b>Pruebas:</b> ejecutor nativo de Node.js y comprobaciones en navegador.')
section('3. Resultado general')
paragraph('<b>29 pruebas aprobadas:</b> 19 de backend y 10 de frontend. La compilación de '
          'los tres workspaces terminó correctamente. Vite emitió un aviso no bloqueante '
          'porque el bundle JavaScript supera 500 kB.')
paragraph('Versión local revisada el 19/09/2026. Alcance: implementación del selector de '
          'idioma, formulario de registro y comprobación de sus reglas.', 9, MUTED)

page(2, 'Organización e idioma', 'Módulos pequeños: presentación, reglas y comunicación')
section('4. Estructura relevante')
code([
    'frontend/src/',
    '  components/LanguageSelector.tsx  # menú de idiomas',
    '  components/Login.tsx             # registro y acceso',
    '  i18n.ts                         # configuración global',
    '  locales/{es,en,pt}.json          # textos traducidos',
    '  utils/validators.ts             # patrones y funciones',
    'backend/src/auth/auth.dto.ts      # validación del servidor',
    'frontend/test/validators.test.cjs  # pruebas de reglas',
    'backend/test/auth-validation.test.cjs',
])
paragraph('El selector no contiene las traducciones del formulario: solo cambia el idioma. '
          'El formulario obtiene el texto por su clave. Los validadores devuelven verdadero o '
          'falso y no dependen de React; por eso pueden probarse de forma independiente.')
section('5. Funcionamiento de i18n')
paragraph('Al seleccionar una opción se llama a <b>i18n.changeLanguage(code)</b>. '
          'Los componentes utilizan <b>useTranslation</b> y la función <b>t</b> para resolver '
          'las etiquetas y mensajes [1]. La configuración declara los idiomas admitidos y '
          'el español como respaldo [2].')
code([
    "resources: { es, en, pt },",
    "fallbackLng: 'es',",
    "supportedLngs: ['es', 'en', 'pt'],",
    "detection: {",
    "  order: ['localStorage', 'navigator', 'htmlTag'],",
    "  caches: ['localStorage'],",
    '}',
    '',
    "t('validation:emailInvalid')",
    "i18n.changeLanguage('en')",
])
paragraph('La selección se conserva en localStorage. Al cambiar de idioma también se '
          'actualizan el atributo <b>lang</b> del documento y el título de la pestaña. '
          'Se verificó la persistencia recargando la página con portugués seleccionado.')
paragraph('<b>Límite:</b> cambiar el idioma no traduce automáticamente los nombres de '
          'productos de la base de datos ni convierte los precios a otra moneda.')

page(3, 'Validación del formulario', 'Patrones reales y explicación de las reglas')
section('6. Expresiones regulares implementadas')
source = (ROOT / 'frontend/src/utils/validators.ts').read_text(encoding='utf-8')
patterns = {key: next(line.strip() for line in source.splitlines() if line.strip().startswith(key + ': /'))
            for key in ('email', 'password', 'fullName')}
for key, title, description in [
    ('email', 'Correo electrónico', 'Exige texto antes y después de @, un punto en el dominio y un segmento final de al menos dos caracteres. Excluye espacios y múltiples arrobas. La función limita además la longitud a 254 caracteres.'),
    ('password', 'Contraseña de registro', 'Los grupos (?=...) exigen una mayúscula ASCII, un dígito y un símbolo del conjunto indicado. {8,72} limita la longitud. La política no exige una minúscula adicional.'),
    ('fullName', 'Nombre completo', 'Acepta letras Unicode, marcas de acento, espacios ordinarios, guiones y apóstrofes. Exige al menos una letra y entre 2 y 120 caracteres. Se aplica trim y normalización NFC antes de probar el patrón.'),
]:
    paragraph(title, 11, TEAL, 5, True)
    code([patterns[key]], 8.5)
    paragraph(description, 10, gap=9)
section('7. Qué significan los símbolos')
paragraph('<b>^ y $:</b> delimitan el inicio y el final del valor. <b>[...]:</b> define un '
          'conjunto de caracteres. <b>+:</b> exige una o más repeticiones. '
          '<b>{mínimo,máximo}:</b> establece una longitud. <b>test(valor):</b> devuelve un '
          'booleano al comprobar el patrón [3].')
section('8. Flujo de validación')
paragraph('1. El usuario escribe y abandona un campo.<br/>2. Se marca el campo como visitado '
          'y se evalúa su regla.<br/>3. Si falla, aparece un mensaje traducido y se marca '
          '<b>aria-invalid</b>.<br/>4. Al enviar, se vuelven a comprobar todos los campos; '
          'si hay errores, no se llama al registro.<br/>5. El backend aplica sus DTO y rechaza '
          'datos inválidos aunque se omita la interfaz.')
paragraph('El formulario usa <b>noValidate</b> para presentar mensajes propios traducidos. '
          'En el inicio de sesión se exige contraseña no vacía, pero no se reaplica la '
          'composición del registro a credenciales anteriores.', 9.5, MUTED)

page(4, 'Evidencia de ejecución', 'Registro en español y menú de selección de idioma')
image('registro-es-menu.png', 340,
      'Figura 1. Detalle real de localhost:5173/login. El menú muestra los tres idiomas y el formulario identifica los tres campos inválidos.')
section('9. Datos utilizados en la demostración')
table(['Campo', 'Entrada de prueba', 'Resultado observado'], [
    ('Nombre completo', '123', 'Error: no contiene un nombre admitido.'),
    ('Correo electrónico', 'correo-invalido', 'Error: falta una dirección con @ y dominio.'),
    ('Contraseña', 'abc', 'Error: no satisface longitud ni composición.'),
], [105, 150, CONTENT - 255])
paragraph('La demostración no crea una cuenta ni realiza compras. Los valores son datos '
          'ficticios. Los mensajes permanecen asociados a su campo mediante '
          '<b>aria-describedby</b> y se anuncian con <b>role="alert"</b>.')
paragraph('También se corrigieron dos casos límite: nombres formados solo por guiones o '
          'por símbolos como × y ÷, y el envío de una contraseña vacía en el inicio de sesión.')

page(5, 'Errores en otros idiomas', 'La misma regla, distintos textos de presentación')
top = Y
for column, name, label in [(0, 'registro-en.png', 'Inglés'), (1, 'registro-pt.png', 'Portugués')]:
    width = (CONTENT - 18) / 2
    x = MARGIN + column * (width + 18)
    PDF.setFillColor(TEAL)
    PDF.setFont('ArialBold', 12)
    PDF.drawString(x, top - 12, label)
    reader = ImageReader(str(EVIDENCE / name))
    iw, ih = reader.getSize()
    height = ih * width / iw
    PDF.drawImage(reader, x, top - 28 - height, width=width, height=height)
Y = top - 28 - max(ImageReader(str(EVIDENCE / name)).getSize()[1] * ((CONTENT - 18) / 2) /
                   ImageReader(str(EVIDENCE / name)).getSize()[0] for name in ['registro-en.png', 'registro-pt.png']) - 18
paragraph('Figuras 2 y 3. Recortes del formulario capturados después de seleccionar inglés y portugués. Los datos inválidos se conservan al cambiar el idioma.', 9, MUTED)
section('10. Comprobaciones manuales')
paragraph('<b>Cambio inmediato:</b> títulos, etiquetas y errores cambian sin recargar la página.<br/>'
          '<b>Persistencia:</b> tras recargar en portugués, el documento conservó '
          '<b>lang="pt"</b> y el título <b>Loja Virtual</b>.<br/>'
          '<b>Datos válidos:</b> María Pérez, alumno@example.com y Curso2026! no mostraron '
          'alertas al abandonar los campos. No se pulsó el envío para crear una cuenta.<br/>'
          '<b>Campo obligatorio:</b> el login mostró «Ingresa tu contraseña» ante una contraseña vacía.')
section('11. Límites de la validación')
paragraph('Una regex verifica formato, no la existencia de un correo ni la identidad del '
          'usuario. El patrón de correo es deliberadamente sencillo, no una implementación '
          'completa de todos los formatos permitidos. El backend conserva IsEmail como '
          'validación adicional. La política de contraseña es la del ejercicio y no equivale '
          'por sí sola a una auditoría integral de seguridad.')

page(6, 'Pruebas y conclusiones', 'Resultados reproducibles y referencias de consulta')
section('12. Resultados automatizados')
table(['Grupo', 'Casos', 'Estado'], [
    ('Backend: registro, acceso, pedidos y concurrencia', '19', 'Aprobados'),
    ('Frontend: regex, traducciones, módulos y transporte', '10', 'Aprobados'),
    ('Total de la suite', '29', 'Sin fallos'),
    ('Compilación frontend, backend y tipos compartidos', '3 workspaces', 'Correcta'),
], [300, 87, CONTENT - 387])
paragraph('Las pruebas agregadas comprueban correos válidos e inválidos, composición y '
          'longitud de contraseña, nombres con tildes, rechazo de símbolos, claves de error '
          'en los tres idiomas y validación de registro en el servidor. Las regresiones HTTP '
          'usan SQLite temporal, sin modificar la base de desarrollo.')
code(['npm test', 'npm run build', 'npm run dev', '# Interfaz: http://localhost:5173/login'], 9)
paragraph('Para ejecutar desde cero, instalar dependencias y configurar el archivo de '
          'entorno del backend, su JWT_SECRET y Prisma según <b>docs/verification.md</b>. '
          'No incluir credenciales reales en el informe ni en las capturas.', 9.5)
section('13. Conclusiones y mejoras')
paragraph('La solución satisface los dos requisitos del ejercicio: selector desplegable '
          'de idioma y formulario con validación regex. La separación entre traducciones, '
          'reglas puras, componentes y DTO facilita el mantenimiento y las pruebas. '
          'Como mejoras futuras se propone completar la navegación por flechas del menú '
          'personalizado, verificar la entrega real de correos y reducir el tamaño del bundle.')
section('14. Referencias')
for label, url in [
    ('[1] react-i18next. useTranslation (hook).', 'https://react.i18next.com/latest/usetranslation-hook'),
    ('[2] i18next. Configuration options.', 'https://www.i18next.com/overview/configuration-options'),
    ('[3] MDN Web Docs. Expresiones regulares.', 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Regular_expressions'),
]:
    paragraph(f'{escape(label)} <link href="{url}" color="#087e8b">Consultar documentación</link>.', 9, gap=5)
paragraph('Fuentes consultadas el 19/09/2026. Las rutas de código y capturas corresponden '
          'al proyecto local revisado para este informe.', 8.5, MUTED, gap=0)
PDF.save()
print(OUTPUT)
