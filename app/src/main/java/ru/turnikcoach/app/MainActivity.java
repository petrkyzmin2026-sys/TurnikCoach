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

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private WebView web;

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

        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.endsWith("/pull.b64")) return b64Asset("pull.webp");
                if (url.endsWith("/knee.b64")) return b64Asset("knee.webp");
                if (url.endsWith("/push.b64")) return b64Asset("push.webp");
                return super.shouldInterceptRequest(view, request);
            }
        });

        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);
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
