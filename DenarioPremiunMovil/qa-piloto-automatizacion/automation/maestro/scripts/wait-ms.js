// Espera fija en ms (evita assertVisible cuando la WebView bloquea viewHierarchy).
var start = Date.now();
while (Date.now() - start < MS) {}
