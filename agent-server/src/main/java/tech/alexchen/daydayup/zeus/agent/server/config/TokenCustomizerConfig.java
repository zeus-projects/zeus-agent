package tech.alexchen.daydayup.zeus.agent.server.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import tech.alexchen.daydayup.zeus.agent.server.security.UserDetailsImpl;

@Configuration
public class TokenCustomizerConfig {

    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> tokenCustomizer() {
        return context -> {
            Object principal = context.getPrincipal().getPrincipal();
            if (principal instanceof UserDetailsImpl u) {
                context.getClaims().claim("userId", u.getId());
                context.getClaims().claim("role", u.getRole());
            }
        };
    }
}
