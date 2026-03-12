package tech.alexchen.daydayup.zeus.agent.server.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public class SecurityUtils {

    public static Long getCurrentUserId() {
        JwtAuthenticationToken jwtAuth = getJwtAuth();
        if (jwtAuth == null) return null;
        Object userId = jwtAuth.getToken().getClaim("userId");
        if (userId instanceof Number n) return n.longValue();
        if (userId instanceof String s) return Long.valueOf(s);
        return null;
    }

    public static String getCurrentUsername() {
        JwtAuthenticationToken jwtAuth = getJwtAuth();
        if (jwtAuth == null) return null;
        return jwtAuth.getToken().getSubject();
    }

    public static String getCurrentUserRole() {
        JwtAuthenticationToken jwtAuth = getJwtAuth();
        if (jwtAuth == null) return null;
        return jwtAuth.getToken().getClaim("role");
    }

    public static boolean isAdmin() {
        return "ADMIN".equals(getCurrentUserRole());
    }

    private static JwtAuthenticationToken getJwtAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            return jwtAuth;
        }
        return null;
    }
}
