FROM base-registry.zhonganinfo.com/env/node:v16.15.0-nginx 



ENV NPM_CONFIG_REGISTRY http://npm.zhonganinfo.com

WORKDIR /za-aigc-platform-admin-static

RUN yum install gettext -y

COPY package.json /za-aigc-platform-admin-static/
# COPY package-lock.json /za-aigc-platform-admin-static/

RUN echo '【开始安装依赖】 ======>>>>>>>>>>>>'

# RUN npm install --legacy-peer-deps
RUN npm install --no-optional --legacy-peer-deps

COPY . /za-aigc-platform-admin-static/

RUN echo '【开始构建Build】 ======>>>>>>>>>>>>'

RUN npm run build

# COPY nginx/site.conf.template /etc/nginx/conf.d/site.conf.template

# COPY docker-entrypoint.sh /

# RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

# ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
