package ru.petr.messenger;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER = 2001;
    private static final String PREFS = "messenger_prefs";
    private static final String KEY_SERVER = "server_url";

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        buildUi();
        String saved = prefs.getString(KEY_SERVER, "");
        if (saved == null || saved.trim().isEmpty()) {
            showServerDialog(true);
        } else {
            loadServer(saved);
        }
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(12, 8, 12, 8);

        TextView title = new TextView(this);
        title.setText("Messenger");
        title.setTextSize(18f);
        title.setPadding(8, 0, 8, 0);
        bar.addView(title, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView serverBtn = new TextView(this);
        serverBtn.setText("Сервер");
        serverBtn.setTextSize(16f);
        serverBtn.setPadding(24, 16, 24, 16);
        serverBtn.setOnClickListener(v -> showServerDialog(false));
        bar.addView(serverBtn);

        root.addView(bar, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        webView = new WebView(this);
        root.addView(webView, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams fileChooserParams) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = fileChooserParams.createIntent();
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                try {
                    startActivityForResult(intent, FILE_CHOOSER);
                } catch (Exception e) {
                    fileCallback = null;
                    Toast.makeText(MainActivity.this, "Не удалось открыть выбор файла", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); }
            catch (Exception e) { Toast.makeText(this, "Не удалось открыть файл", Toast.LENGTH_SHORT).show(); }
        });
    }

    private void showServerDialog(boolean mandatory) {
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setHint("https://example.com или http://192.168.1.50:8000");
        input.setText(prefs.getString(KEY_SERVER, ""));
        input.setSelectAllOnFocus(true);

        AlertDialog.Builder b = new AlertDialog.Builder(this)
                .setTitle("Адрес сервера Messenger")
                .setMessage("Укажите базовый адрес сервера. Приложение откроет интерфейс /app/.")
                .setView(input)
                .setPositiveButton("Подключить", null);
        if (!mandatory) b.setNegativeButton("Отмена", null);
        AlertDialog dialog = b.create();
        dialog.setOnShowListener(d -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String raw = input.getText().toString().trim();
            if (raw.isEmpty()) {
                input.setError("Введите адрес сервера");
                return;
            }
            if (!raw.startsWith("http://") && !raw.startsWith("https://")) raw = "http://" + raw;
            raw = raw.replaceAll("/+$", "");
            prefs.edit().putString(KEY_SERVER, raw).apply();
            dialog.dismiss();
            loadServer(raw);
        }));
        dialog.setCancelable(!mandatory);
        dialog.show();
    }

    private void loadServer(String base) {
        String url = base.replaceAll("/+$", "") + "/app/";
        webView.loadUrl(url);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    result = new Uri[n];
                    for (int i = 0; i < n; i++) result[i] = data.getClipData().getItemAt(i).getUri();
                } else if (data.getData() != null) {
                    result = new Uri[]{data.getData()};
                }
            }
            if (fileCallback != null) fileCallback.onReceiveValue(result);
            fileCallback = null;
        }
    }
}
