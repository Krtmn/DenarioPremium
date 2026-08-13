/**
 * Patches @capacitor/android HttpRequestHandler to decompress gzip JSON responses
 * (Spring Boot server.compression). Idempotent — safe on every npm install.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@capacitor',
  'android',
  'capacitor',
  'src',
  'main',
  'java',
  'com',
  'getcapacitor',
  'plugin',
  'util',
  'HttpRequestHandler.java',
);

const MARKER = 'openResponseStream';

if (!fs.existsSync(target)) {
  console.log('[capacitor-gzip] @capacitor/android not installed — skip');
  process.exit(0);
}

let content = fs.readFileSync(target, 'utf8');

if (content.includes(MARKER)) {
  console.log('[capacitor-gzip] patch already applied');
  process.exit(0);
}

if (!content.includes('import java.util.Map;')) {
  console.error('[capacitor-gzip] unexpected HttpRequestHandler.java — skip');
  process.exit(0);
}

content = content.replace(
  'import java.util.Map;\r\nimport org.json.JSONArray;',
  'import java.util.Map;\r\nimport java.util.zip.GZIPInputStream;\r\nimport org.json.JSONArray;',
);
content = content.replace(
  'import java.util.Map;\nimport org.json.JSONArray;',
  'import java.util.Map;\nimport java.util.zip.GZIPInputStream;\nimport org.json.JSONArray;',
);

const oldReadData = `    public static Object readData(ICapacitorHttpUrlConnection connection, ResponseType responseType) throws IOException, JSONException {
        InputStream errorStream = connection.getErrorStream();
        String contentType = connection.getHeaderField("Content-Type");

        if (errorStream != null) {
            if (isOneOf(contentType, MimeType.APPLICATION_JSON, MimeType.APPLICATION_VND_API_JSON)) {
                return parseJSON(readStreamAsString(errorStream));
            } else {
                return readStreamAsString(errorStream);
            }
        } else if (contentType != null && contentType.contains(MimeType.APPLICATION_JSON.getValue())) {
            // backward compatibility
            return parseJSON(readStreamAsString(connection.getInputStream()));
        } else {
            InputStream stream = connection.getInputStream();
            switch (responseType) {
                case ARRAY_BUFFER:
                case BLOB:
                    return readStreamAsBase64(stream);
                case JSON:
                    return parseJSON(readStreamAsString(stream));
                case DOCUMENT:
                case TEXT:
                default:
                    return readStreamAsString(stream);
            }
        }
    }`;

const newReadData = `    public static Object readData(ICapacitorHttpUrlConnection connection, ResponseType responseType) throws IOException, JSONException {
        InputStream errorStream = connection.getErrorStream();
        String contentType = connection.getHeaderField("Content-Type");

        if (errorStream != null) {
            InputStream stream = openResponseStream(connection, errorStream);
            if (isOneOf(contentType, MimeType.APPLICATION_JSON, MimeType.APPLICATION_VND_API_JSON)) {
                return parseJSON(readStreamAsString(stream));
            } else {
                return readStreamAsString(stream);
            }
        } else if (contentType != null && contentType.contains(MimeType.APPLICATION_JSON.getValue())) {
            // backward compatibility
            InputStream stream = openResponseStream(connection, connection.getInputStream());
            return parseJSON(readStreamAsString(stream));
        } else {
            InputStream stream = openResponseStream(connection, connection.getInputStream());
            switch (responseType) {
                case ARRAY_BUFFER:
                case BLOB:
                    return readStreamAsBase64(stream);
                case JSON:
                    return parseJSON(readStreamAsString(stream));
                case DOCUMENT:
                case TEXT:
                default:
                    return readStreamAsString(stream);
            }
        }
    }

    /**
     * Decompresses gzip-encoded response bodies when Content-Encoding is gzip.
     * Spring Boot server.compression sends standard Content-Encoding gzip JSON.
     */
    private static InputStream openResponseStream(ICapacitorHttpUrlConnection connection, InputStream stream)
        throws IOException {
        if (stream == null) {
            return null;
        }
        String contentEncoding = connection.getHeaderField("Content-Encoding");
        if (contentEncoding != null && contentEncoding.toLowerCase(Locale.ROOT).contains("gzip")) {
            if (!(stream instanceof GZIPInputStream)) {
                return new GZIPInputStream(stream);
            }
        }
        return stream;
    }`;

if (!content.includes(oldReadData.replace(/\r\n/g, '\n').slice(0, 80))) {
  // try CRLF variant
  const oldCrlf = oldReadData.replace(/\n/g, '\r\n');
  const newCrlf = newReadData.replace(/\n/g, '\r\n');
  if (content.includes(oldCrlf)) {
    content = content.replace(oldCrlf, newCrlf);
  } else {
    console.error('[capacitor-gzip] readData block not found — Capacitor version mismatch?');
    process.exit(1);
  }
} else {
  content = content.replace(oldReadData, newReadData);
}

fs.writeFileSync(target, content, 'utf8');
console.log('[capacitor-gzip] patched HttpRequestHandler.java');
