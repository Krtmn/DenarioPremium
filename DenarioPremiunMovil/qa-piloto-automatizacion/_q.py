import sqlite3, os
p = os.path.join(os.path.dirname(__file__), 'dp.db')
c = sqlite3.connect(p)
print("== MAN-H701 detalle ==")
for r in c.execute("SELECT id_product_min_mul,co_product,id_product,id_enterprise,qu_minimum,qu_multiple,flag FROM product_min_muls WHERE co_product='MAN-H701' ORDER BY id_product_min_mul"):
    print(r)
print("== lo que devuelve la query de la app (getProductMinMul, ent=1) ==")
q = ("SELECT id_product_min_mul,qu_minimum,qu_multiple FROM product_min_muls "
     "WHERE id_enterprise=1 AND (qu_minimum>1 OR qu_multiple>1) AND flag='true' AND id_product=2260")
for r in c.execute(q):
    print(r)
print("== total filas de product_min_muls ==")
print(c.execute("SELECT count(*) FROM product_min_muls").fetchone())
print("== productos con filas duplicadas (top 10) ==")
for r in c.execute("SELECT id_product, count(*) n FROM product_min_muls GROUP BY id_product HAVING n>1 ORDER BY n DESC LIMIT 10"):
    print(r)
