FROM httpd:2.4

# Enable necessary Apache modules
RUN a2enmod proxy proxy_http ssl
RUN a2enmod rewrite headers

# Create a place to store SSL certificates
RUN mkdir -p /etc/ssl/certs

# The official Docker image places the default config here,
# we need to include our custom config.
RUN echo "Include /etc/apache2/sites-available/your-domain.conf" >> /usr/local/apache2/conf/httpd.conf

# Clean up default virtual host
RUN rm -f /usr/local/apache2/conf/extra/httpd-vhosts.conf

# Expose ports 80 and 443
EXPOSE 80
EXPOSE 443

# Start the Apache server
CMD ["httpd-foreground"]