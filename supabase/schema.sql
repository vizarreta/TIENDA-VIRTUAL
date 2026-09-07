-- ============================================================
-- 🛒 TIENDA VIRTUAL — Esquema completo para Supabase (PostgreSQL)
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- Dashboard → SQL Editor → New Query → Pegar y ejecutar
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLA: categories (Categorías de productos)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE categories IS 'Categorías de productos (Calzado, Ropa, Accesorios, Electrónica, etc.)';

-- ────────────────────────────────────────────────────────────
-- 2. TABLA: products (Catálogo de productos)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT           NOT NULL,
  description TEXT,
  price       DECIMAL(10,2)  NOT NULL CHECK (price >= 0),
  image       TEXT,
  stock       INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id BIGINT         REFERENCES categories(id) ON DELETE SET NULL,
  is_active   BOOLEAN        NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE products IS 'Catálogo de productos de la tienda';

-- Índices para búsquedas rápidas
CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_products_name      ON products USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_products_is_active ON products(is_active);

-- ────────────────────────────────────────────────────────────
-- 3. TABLA: profiles (Perfiles de usuario — extiende auth.users de Supabase)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  full_name  TEXT,
  phone      TEXT,
  avatar_url TEXT,
  role       TEXT        NOT NULL DEFAULT 'customer'
                         CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfil extendido del usuario, vinculado a auth.users de Supabase';

-- ────────────────────────────────────────────────────────────
-- 4. TABLA: addresses (Direcciones de envío del usuario)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL DEFAULT 'Casa',   -- Casa, Oficina, etc.
  street      TEXT        NOT NULL,
  city        TEXT        NOT NULL,
  state       TEXT        NOT NULL,
  zip_code    TEXT        NOT NULL,
  country     TEXT        NOT NULL DEFAULT 'Perú',
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE addresses IS 'Direcciones de envío de cada usuario';

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ────────────────────────────────────────────────────────────
-- 5. TABLA: carts (Carrito de compras por usuario/sesión)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,        -- Para usuarios no autenticados (visitantes)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un carrito activo por usuario O por sesión
  CONSTRAINT chk_cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

COMMENT ON TABLE carts IS 'Carrito de compras — soporta usuarios autenticados y visitantes por sesión';

CREATE INDEX idx_carts_user    ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);

-- ────────────────────────────────────────────────────────────
-- 6. TABLA: cart_items (Ítems dentro del carrito)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cart_id    BIGINT      NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id BIGINT      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un producto solo puede estar una vez por carrito
  UNIQUE(cart_id, product_id)
);

COMMENT ON TABLE cart_items IS 'Productos dentro de un carrito de compras';

CREATE INDEX idx_cart_items_cart    ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- ────────────────────────────────────────────────────────────
-- 7. TABLA: orders (Órdenes / Pedidos)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number     TEXT           UNIQUE,            -- Auto-generado: ORD-2026-000001
  user_id          UUID           NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  address_id       BIGINT         REFERENCES addresses(id) ON DELETE SET NULL,
  shipping_address TEXT,          -- Snapshot de la dirección completa al momento de la compra
  status           TEXT           NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal         DECIMAL(10,2)  NOT NULL DEFAULT 0,
  shipping_cost    DECIMAL(10,2)  NOT NULL DEFAULT 0,
  tax              DECIMAL(10,2)  NOT NULL DEFAULT 0,
  total            DECIMAL(10,2)  NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE orders IS 'Órdenes de compra realizadas por los usuarios';

CREATE INDEX idx_orders_user   ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ────────────────────────────────────────────────────────────
-- 8. TABLA: order_items (Detalle de productos en cada orden)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id     BIGINT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   BIGINT         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT           NOT NULL,  -- Snapshot del nombre al momento de la compra
  quantity     INTEGER        NOT NULL CHECK (quantity > 0),
  unit_price   DECIMAL(10,2)  NOT NULL CHECK (unit_price >= 0),
  subtotal     DECIMAL(10,2)  NOT NULL CHECK (subtotal >= 0),
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_items IS 'Detalle de productos comprados en cada orden (snapshot al momento de compra)';

CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ────────────────────────────────────────────────────────────
-- 9. TABLA: payments (Pagos y transacciones)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id        BIGINT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method  TEXT           NOT NULL CHECK (payment_method IN ('card', 'paypal', 'transfer', 'cash_on_delivery')),
  payment_status  TEXT           NOT NULL DEFAULT 'pending'
                                 CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  transaction_id  TEXT,          -- ID externo de la pasarela de pago
  amount          DECIMAL(10,2)  NOT NULL CHECK (amount >= 0),
  currency        TEXT           NOT NULL DEFAULT 'USD',
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE payments IS 'Registro de pagos y transacciones vinculados a cada orden';

CREATE INDEX idx_payments_order  ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- ────────────────────────────────────────────────────────────
-- 10. TABLA: order_history (Historial de estados de cada pedido)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_history (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id       BIGINT      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status TEXT,       -- Estado anterior (NULL si es la creación)
  new_status     TEXT        NOT NULL,
  changed_by     UUID        REFERENCES profiles(id) ON DELETE SET NULL,  -- Quién hizo el cambio
  notes          TEXT,        -- Observaciones del cambio (ej: "Paquete entregado al portero")
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_history IS 'Registro cronológico de todos los cambios de estado de cada pedido (auditoría)';

CREATE INDEX idx_order_history_order ON order_history(order_id);
CREATE INDEX idx_order_history_date  ON order_history(created_at);

-- ────────────────────────────────────────────────────────────
-- 11. TABLA: invoices (Facturas)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id        BIGINT         NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  invoice_number  TEXT           UNIQUE,            -- Auto-generado: FAC-2026-000001
  user_id         UUID           NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

  -- Datos del cliente al momento de facturación (snapshot)
  customer_name   TEXT           NOT NULL,
  customer_email  TEXT,
  customer_phone  TEXT,
  customer_address TEXT,

  -- Datos fiscales
  tax_id          TEXT,          -- RUC / NIT / RFC del cliente
  business_name   TEXT,          -- Razón social (si aplica)

  -- Montos
  subtotal        DECIMAL(10,2)  NOT NULL CHECK (subtotal >= 0),
  tax_amount      DECIMAL(10,2)  NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_cost   DECIMAL(10,2)  NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  discount        DECIMAL(10,2)  NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total           DECIMAL(10,2)  NOT NULL CHECK (total >= 0),

  -- Estado
  status          TEXT           NOT NULL DEFAULT 'issued'
                                 CHECK (status IN ('draft', 'issued', 'paid', 'cancelled', 'refunded')),
  issued_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  pdf_url         TEXT,          -- URL del PDF generado en Supabase Storage

  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE invoices IS 'Facturas emitidas por cada orden — incluye snapshot de datos del cliente y montos';

CREATE INDEX idx_invoices_order   ON invoices(order_id);
CREATE INDEX idx_invoices_user    ON invoices(user_id);
CREATE INDEX idx_invoices_number  ON invoices(invoice_number);
CREATE INDEX idx_invoices_status  ON invoices(status);

-- ────────────────────────────────────────────────────────────
-- 12. TABLA: reviews (Reseñas de productos)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id BIGINT      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating     INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un usuario solo puede dejar una reseña por producto
  UNIQUE(user_id, product_id)
);

COMMENT ON TABLE reviews IS 'Reseñas y calificaciones de productos por los usuarios';

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user    ON reviews(user_id);

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas que tienen updated_at
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para crear perfil automáticamente al registrarse un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger para registrar automáticamente cambios de estado en order_history
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_history (order_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_order_status_changed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- Función para generar order_number automáticamente (ORD-2026-000001)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(id), 0) + 1 INTO next_num FROM orders;
  NEW.order_number := 'ORD-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- Función para generar invoice_number automáticamente (FAC-2026-000001)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(id), 0) + 1 INTO next_num FROM invoices;
  NEW.invoice_number := 'FAC-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- Función para descontar stock automáticamente al agregar items a una orden
CREATE OR REPLACE FUNCTION decrement_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;

  -- Verificar que el stock no quede negativo
  IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto ID %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_stock_on_order
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION decrement_product_stock();

-- Función para restaurar stock al cancelar una orden
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
    UPDATE products p
    SET stock = p.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION restore_stock_on_cancel();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Políticas de seguridad
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;

-- Categories y Products: lectura pública
CREATE POLICY "categories_read_all" ON categories FOR SELECT USING (true);
CREATE POLICY "products_read_active" ON products  FOR SELECT USING (is_active = true);

-- Profiles: cada usuario solo ve/edita su perfil
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Addresses: cada usuario solo maneja sus direcciones
CREATE POLICY "addresses_select_own" ON addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "addresses_insert_own" ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses_update_own" ON addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "addresses_delete_own" ON addresses FOR DELETE USING (auth.uid() = user_id);

-- Carts: cada usuario solo ve su carrito
CREATE POLICY "carts_select_own" ON carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "carts_insert_own" ON carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carts_update_own" ON carts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "carts_delete_own" ON carts FOR DELETE USING (auth.uid() = user_id);

-- Cart Items: acceso a través del carrito propio
CREATE POLICY "cart_items_select_own" ON cart_items FOR SELECT
  USING (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));
CREATE POLICY "cart_items_insert_own" ON cart_items FOR INSERT
  WITH CHECK (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));
CREATE POLICY "cart_items_update_own" ON cart_items FOR UPDATE
  USING (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));
CREATE POLICY "cart_items_delete_own" ON cart_items FOR DELETE
  USING (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));

-- Orders: cada usuario solo ve sus órdenes
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items: acceso a través de la orden propia
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Payments: acceso a través de la orden propia
CREATE POLICY "payments_select_own" ON payments FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Order History: cada usuario ve el historial de sus órdenes
CREATE POLICY "order_history_select_own" ON order_history FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Invoices: cada usuario ve y descarga sus facturas
CREATE POLICY "invoices_select_own" ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Reviews: lectura pública, escritura solo propia
CREATE POLICY "reviews_read_all"   ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- DATOS INICIALES (Seed) — Categorías y Productos
-- ============================================================

INSERT INTO categories (name, description) VALUES
  ('Calzado',     'Zapatos, zapatillas y todo tipo de calzado'),
  ('Ropa',        'Camisetas, gorras y prendas de vestir'),
  ('Accesorios',  'Mochilas, relojes, gafas y más'),
  ('Electrónica', 'Audífonos, gadgets y dispositivos electrónicos');

INSERT INTO products (name, description, price, image, stock, category_id) VALUES
  ('Zapatos Deportivos',  'Zapatos ligeros con suela antideslizante, ideales para correr y entrenar.',       89.99,  'https://picsum.photos/400/300?random=1', 25, (SELECT id FROM categories WHERE name = 'Calzado')),
  ('Camiseta Premium',    'Camiseta de algodón 100% con diseño moderno y corte slim fit.',                   34.99,  'https://picsum.photos/400/300?random=2', 50, (SELECT id FROM categories WHERE name = 'Ropa')),
  ('Mochila Urbana',      'Mochila resistente al agua con compartimento para laptop de 15 pulgadas.',        59.99,  'https://picsum.photos/400/300?random=3', 30, (SELECT id FROM categories WHERE name = 'Accesorios')),
  ('Audífonos Bluetooth', 'Audífonos inalámbricos con cancelación de ruido y 20 horas de batería.',          49.99,  'https://picsum.photos/400/300?random=4', 40, (SELECT id FROM categories WHERE name = 'Electrónica')),
  ('Reloj Clásico',       'Reloj analógico con correa de cuero genuino y resistencia al agua.',             129.99,  'https://picsum.photos/400/300?random=5', 15, (SELECT id FROM categories WHERE name = 'Accesorios')),
  ('Gafas de Sol',        'Gafas polarizadas con protección UV400 y montura ultraligera.',                   44.99,  'https://picsum.photos/400/300?random=6', 35, (SELECT id FROM categories WHERE name = 'Accesorios')),
  ('Zapatillas Casual',   'Zapatillas cómodas para uso diario con plantilla acolchada.',                     74.99,  'https://picsum.photos/400/300?random=7', 20, (SELECT id FROM categories WHERE name = 'Calzado')),
  ('Gorra Snapback',      'Gorra ajustable con bordado frontal y visera plana.',                             24.99,  'https://picsum.photos/400/300?random=8', 60, (SELECT id FROM categories WHERE name = 'Ropa'));
