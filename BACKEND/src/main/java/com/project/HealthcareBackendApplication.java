package com.project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

@SpringBootApplication
public class HealthcareBackendApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(HealthcareBackendApplication.class, args);
	}

	private static void loadDotEnv() {
		String[] possiblePaths = { ".env", "../.env", "BACKEND/.env" };
		for (String path : possiblePaths) {
			File envFile = new File(path);
			if (envFile.exists() && envFile.isFile()) {
				try (FileInputStream fis = new FileInputStream(envFile)) {
					Properties props = new Properties();
					props.load(fis);
					for (String key : props.stringPropertyNames()) {
						String value = props.getProperty(key);
						if (System.getProperty(key) == null && System.getenv(key) == null) {
							System.setProperty(key, value);
						}
					}
					System.out.println("✅ Loaded environment variables from: " + envFile.getAbsolutePath());
					break;
				} catch (IOException e) {
					System.err.println("⚠️ Could not load .env from " + path + ": " + e.getMessage());
				}
			}
		}
	}

}
