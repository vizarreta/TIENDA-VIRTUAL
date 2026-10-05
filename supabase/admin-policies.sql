-- ============================================================
-- FUNCIÓN HELPER: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE;

-- ============================================================
-- POLÍTICAS RLS ADMIN PARA PRODUCTS
-- ============================================================
-- Admin: CRUD completo en products
CREATE POLICY "products_admin_all" ON products 
  FOR ALL USING (is_admin());

-- Admin: CRUD completo en categories  
CREATE POLICY "categories_admin_all" ON categories 
  FOR ALL USING (is_admin());

-- ============================================================
-- POLÍTICAS RLS ADMIN PARA GESTIÓN DE ÓRDENES/FACTURAS
-- ============================================================
CREATE POLICY "orders_admin_all" ON orders 
  FOR ALL USING (is_admin());

CREATE POLICY "order_items_admin_all" ON order_items 
  FOR ALL USING (is_admin());

CREATE POLICY "invoices_admin_all" ON invoices 
  FOR ALL USING (is_admin());

CREATE POLICY "payments_admin_all" ON payments 
  FOR ALL USING (is_admin());

-- ============================================================
-- VERIFICAR POLÍTICAS CREADAS
-- ============================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'categories', 'orders', 'order_items', 'invoices', 'payments')
ORDER BY tablename, policyname;