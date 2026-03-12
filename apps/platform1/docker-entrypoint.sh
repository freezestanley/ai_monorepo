#!/usr/bin/env sh
set -eu

envsubst '${DEPLOY_ENV} ${DEPLOY_ENV}' < /etc/nginx/conf.d/site.conf.template > /etc/nginx/conf.d/site.conf

exec "$@"