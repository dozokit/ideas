-- 1.3.0: the owner's own address for every board, like ideas.your-product.com (Settings → Your own
-- address). It is saved only once a test request through it reached this Worker. No row: this copy's own address.
CREATE TABLE address (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  domain TEXT NOT NULL
);
