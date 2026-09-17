package ru.turnikcoach.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String HOTFIX_URL = "https://raw.githubusercontent.com/petrkyzmin2026-sys/TurnikCoach/main/live/hotfix.js";
    private static final String HOTFIX_MARKER = "TURNIKCOACH_HOTFIX";
    private static final String HOTFIX_CACHE = "turnikcoach-hotfix.js";

    private WebView web;
    private volatile boolean pageReady = false;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(8, 12, 16));
        getWindow().setNavigationBarColor(Color.rgb(8, 12, 16));

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(8, 12, 16));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.endsWith("/pull.b64")) return b64Asset("pull.webp");
                if (url.endsWith("/knee.b64")) return b64Asset("knee.webp");
                if (url.endsWith("/push.b64")) return b64Asset("push.webp");
                return super.shouldInterceptRequest(view, request);
            }

            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                pageReady = true;
                applyAssetHotfix();
                applyCachedHotfix();
            }
        });

        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);
        startHotfixUpdate();
    }

    private void startHotfixUpdate() {
        new Thread(() -> {
            try {
                String fresh = downloadText(HOTFIX_URL);
                if (!validHotfix(fresh)) return;

                String old = readFile(new File(getFilesDir(), HOTFIX_CACHE));
                if (!fresh.equals(old)) {
                    try (FileOutputStream out = new FileOutputStream(new File(getFilesDir(), HOTFIX_CACHE))) {
                        out.write(fresh.getBytes(StandardCharsets.UTF_8));
                    }
                }

                if (pageReady) runOnUiThread(() -> applyScript(fresh));
            } catch (Exception ignored) {
                // Offline mode is intentional: bundled/cached logic continues to work.
            }
        }, "TurnikCoachHotUpdate").start();
    }

    private String downloadText(String address) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(address).openConnection();
        c.setConnectTimeout(3500);
        c.setReadTimeout(4500);
        c.setUseCaches(false);
        c.setInstanceFollowRedirects(true);
        c.setRequestProperty("Cache-Control", "no-cache");
        c.setRequestProperty("User-Agent", "TurnikCoach-Android/5.14");
        try {
            if (c.getResponseCode() != HttpURLConnection.HTTP_OK) return null;
            try (InputStream in = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buf = new byte[8192];
                int n;
                int total = 0;
                while ((n = in.read(buf)) > 0) {
                    total += n;
                    if (total > 256 * 1024) return null;
                    out.write(buf, 0, n);
                }
                return out.toString(StandardCharsets.UTF_8.name());
            }
        } finally {
            c.disconnect();
        }
    }

    private boolean validHotfix(String js) {
        return js != null && js.length() >= 100 && js.length() <= 256 * 1024 && js.contains(HOTFIX_MARKER);
    }

    private void applyAssetHotfix() {
        try (InputStream in = getAssets().open("hotfix.js"); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            String js = out.toString(StandardCharsets.UTF_8.name());
            if (validHotfix(js)) applyScript(js);
        } catch (Exception ignored) {
        }
    }

    private void applyCachedHotfix() {
        try {
            String js = readFile(new File(getFilesDir(), HOTFIX_CACHE));
            if (validHotfix(js)) applyScript(js);
        } catch (Exception ignored) {
        }
    }

    private String readFile(File file) {
        if (file == null || !file.isFile()) return null;
        try (InputStream in = new FileInputStream(file); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return null;
        }
    }

    private void applyScript(String js) {
        if (web == null || !validHotfix(js)) return;
        String quoted = JSONObject.quote(js);
        web.evaluateJavascript(
                "(function(){try{(0,eval)(" + quoted + ");}catch(e){console.error('TurnikCoach hot update',e);}})();",
                null
        );
    }

    private WebResourceResponse b64Asset(String name) {
        try (InputStream in = getAssets().open(name); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            String encoded = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            return new WebResourceResponse(
                    "text/plain",
                    "utf-8",
                    new ByteArrayInputStream(encoded.getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception e) {
            return new WebResourceResponse(
                    "text/plain",
                    "utf-8",
                    new ByteArrayInputStream(new byte[0])
            );
        }
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
