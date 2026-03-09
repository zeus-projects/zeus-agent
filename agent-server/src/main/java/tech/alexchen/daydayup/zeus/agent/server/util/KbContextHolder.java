package tech.alexchen.daydayup.zeus.agent.server.util;

public class KbContextHolder {

    private static final ThreadLocal<Long> HOLDER = new ThreadLocal<>();

    public static void set(Long kbId) {
        HOLDER.set(kbId);
    }

    public static Long get() {
        return HOLDER.get();
    }

    public static void clear() {
        HOLDER.remove();
    }
}
