package javax.xml.bind;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.Locale;
import java.util.TimeZone;

public final class DatatypeConverter {
    private DatatypeConverter() {}

    public static Calendar parseDateTime(String value) {
        String[] patterns = {
                "yyyy-MM-dd'T'HH:mm:ssXXX",
                "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                "yyyy-MM-dd'T'HH:mm:ss'Z'"
        };
        for (String pattern : patterns) {
            try {
                SimpleDateFormat f = new SimpleDateFormat(pattern, Locale.US);
                if (pattern.endsWith("'Z'")) f.setTimeZone(TimeZone.getTimeZone("UTC"));
                GregorianCalendar c = new GregorianCalendar();
                c.setTime(f.parse(value));
                return c;
            } catch (Exception ignored) {}
        }
        throw new IllegalArgumentException("Invalid date: " + value);
    }
}
