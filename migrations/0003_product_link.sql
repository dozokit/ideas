-- 1.2.0: each board can name the product its people come from, so a visitor who can't vote yet is
-- told where to open it ("open Ideas from <product name>"). Both optional; the link is https only.
ALTER TABLE boards ADD COLUMN product_name TEXT;
ALTER TABLE boards ADD COLUMN product_url TEXT;
