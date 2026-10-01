# Apache + PHP 7.4, a versão do host (medido em 2026-09-28), com mysqli,
# mod_ssl e um certificado autoassinado para lotusotec.cl e www gerado no
# build: a cópia é servida como https://lotusotec.cl (spec D4). A imagem
# php:7.4-apache está sem suporte; serve porque é a versão que o WordPress
# vivo roda. Se sumir do registro, o ensaio para e vira decisão (spec §11).
FROM php:7.4-apache

RUN docker-php-ext-install mysqli \
  && a2enmod ssl rewrite headers \
  && openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
       -keyout /etc/ssl/private/ensaio.key \
       -out /etc/ssl/certs/ensaio.crt \
       -subj '/CN=lotusotec.cl' \
       -addext 'subjectAltName=DNS:lotusotec.cl,DNS:www.lotusotec.cl'

COPY ensaio.conf /etc/apache2/sites-available/ensaio.conf
RUN a2dissite 000-default && a2ensite ensaio
