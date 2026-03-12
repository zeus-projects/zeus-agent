package tech.alexchen.daydayup.zeus.agent.server;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * @author alexchen
 * @since 2026-02-05 11:45
 */
@SpringBootApplication
@MapperScan("tech.alexchen.daydayup.zeus.agent.server.mapper")
public class ZeusAgentServerApplication {

    public static void main(String[] args) {
      SpringApplication.run(ZeusAgentServerApplication.class, args);
    }
}
