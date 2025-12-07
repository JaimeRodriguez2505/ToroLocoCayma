# Usar imagen oficial de Node.js 18 para el build
FROM node:18-alpine as build

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Usar nginx para servir la aplicación
FROM nginx:alpine

# Instalar tzdata para zona horaria
RUN apk add --no-cache tzdata

# Configurar zona horaria
ENV TZ=America/Lima
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copiar los archivos construidos al directorio de nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
