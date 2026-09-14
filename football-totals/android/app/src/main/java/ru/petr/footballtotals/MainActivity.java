package ru.petr.footballtotals;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String APP_URL="https://football-totals-ledt.onrender.com/app/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView=new WebView(this);
        setContentView(webView);
        WebSettings s=webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl(APP_URL);
    }

    @Override
    public void onBackPressed() {
        if(webView!=null && webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
}
