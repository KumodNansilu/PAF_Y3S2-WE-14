package com.paf.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

	private String frontendUrl = "http://localhost:3000";
	private final Security security = new Security();

	public String getFrontendUrl() {
		return frontendUrl;
	}

	public void setFrontendUrl(String frontendUrl) {
		this.frontendUrl = frontendUrl;
	}

	public Security getSecurity() {
		return security;
	}

	public static class Security {

		private String adminEmails = "";
		private String technicianEmails = "";

		public String getAdminEmails() {
			return adminEmails;
		}

		public void setAdminEmails(String adminEmails) {
			this.adminEmails = adminEmails;
		}

		public String getTechnicianEmails() {
			return technicianEmails;
		}

		public void setTechnicianEmails(String technicianEmails) {
			this.technicianEmails = technicianEmails;
		}
	}
}