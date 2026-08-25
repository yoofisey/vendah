CREATE TABLE page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  referrer TEXT,
  visitor_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "tenant_read_views" ON page_views FOR SELECT USING (tenant_id = current_tenant_id());
CREATE INDEX idx_page_views_tenant_date ON page_views(tenant_id, created_at DESC);
