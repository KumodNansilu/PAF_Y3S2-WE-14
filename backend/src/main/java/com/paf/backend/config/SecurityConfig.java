package com.paf.backend.config;

import java.util.List;
import java.util.Set;
import java.util.HashSet;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.paf.backend.repository.AppUserRepository;
import com.paf.backend.service.UserPersistenceService;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService,
			AppProperties appProperties,
			UserPersistenceService userPersistenceService) throws Exception {

		return http
				.cors(Customizer.withDefaults())
				.csrf(AbstractHttpConfigurer::disable)
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
				.authorizeHttpRequests(authorize -> authorize
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers("/", "/error", "/login**", "/oauth2/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/auth/**").permitAll()
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "MANAGER")
						.requestMatchers("/api/technician/**").hasAnyRole("TECHNICIAN", "ADMIN", "MANAGER")
						.anyRequest().authenticated())
				.oauth2Login(oauth2 -> oauth2
						.userInfoEndpoint(userInfo -> userInfo
								.userService(customOAuth2UserService)
								.oidcUserService(customOidcUserService(appProperties, userPersistenceService)))
						.successHandler(new SimpleUrlAuthenticationSuccessHandler(appProperties.getFrontendUrl())))
				.logout(logout -> logout
						.logoutUrl("/api/auth/logout")
						.logoutSuccessHandler((request, response, authentication) -> response.setStatus(200))
						.invalidateHttpSession(true)
						.clearAuthentication(true)
						.deleteCookies("JSESSIONID"))
				.exceptionHandling(exceptions -> exceptions.authenticationEntryPoint(unauthorizedEntryPoint()))
				.build();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(AppProperties appProperties) {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(List.of(appProperties.getFrontendUrl()));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(true);
		configuration.setExposedHeaders(List.of("Set-Cookie"));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	@Bean
	OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService(
			AppProperties appProperties,
			UserPersistenceService userPersistenceService) {
		DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
		return userRequest -> {
			OAuth2User oauth2User = delegate.loadUser(userRequest);
			String email = String.valueOf(oauth2User.getAttributes().getOrDefault("email", "")).toLowerCase();
			String name = String.valueOf(oauth2User.getAttributes().getOrDefault("name", email));
			String picture = String.valueOf(oauth2User.getAttributes().getOrDefault("picture", ""));
			var authorities = RoleMapper.authoritiesFor(email, appProperties);

			userPersistenceService.upsertOAuthLoginUser(
					email,
					name,
					picture,
					"google",
					authorities.stream().map(a -> a.getAuthority()).toList());

			return new DefaultOAuth2User(authorities, oauth2User.getAttributes(), "email");
		};
	}

	private OAuth2UserService<OidcUserRequest, OidcUser> customOidcUserService(
			AppProperties appProperties,
			UserPersistenceService userPersistenceService) {
		OidcUserService delegate = new OidcUserService();
		return userRequest -> {
			OidcUser oidcUser = delegate.loadUser(userRequest);
			String email = String.valueOf(oidcUser.getAttributes().getOrDefault("email", "")).toLowerCase();
			String name = String.valueOf(oidcUser.getAttributes().getOrDefault("name", email));
			String picture = String.valueOf(oidcUser.getAttributes().getOrDefault("picture", ""));
			var authorities = RoleMapper.authoritiesFor(email, appProperties);

			userPersistenceService.upsertOAuthLoginUser(
					email,
					name,
					picture,
					"google",
					authorities.stream().map(a -> a.getAuthority()).toList());

			return new DefaultOidcUser(authorities, oidcUser.getIdToken(), oidcUser.getUserInfo(), "email");
		};
	}

	@Bean
	AuthenticationEntryPoint unauthorizedEntryPoint() {
		return (request, response, authException) -> response.sendError(401, "Unauthorized");
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	UserDetailsService userDetailsService(AppUserRepository appUserRepository, AppProperties appProperties) {
		return email -> appUserRepository.findByEmailIgnoreCase(email)
				.filter(user -> user.getPasswordHash() != null && !user.getPasswordHash().isBlank())
				.map(user -> {
					Set<String> effectiveRoles = new HashSet<>();

					if (user.getRoles() != null && !user.getRoles().isEmpty()) {
						effectiveRoles.addAll(user.getRoles());
					}

					RoleMapper.authoritiesFor(user.getEmail(), appProperties)
							.stream()
							.map(authority -> authority.getAuthority())
							.forEach(effectiveRoles::add);

					if (effectiveRoles.isEmpty()) {
						effectiveRoles.add("ROLE_USER");
					}

					return User.withUsername(user.getEmail())
							.password(user.getPasswordHash())
							.authorities(effectiveRoles.toArray(new String[0]))
							.build();
				})
				.orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));
	}

	@Bean
	AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
		provider.setUserDetailsService(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder);
		return provider;
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}
}