# Usar imagen oficial de Node.js 18
FROM node:18.20.5-alpine3.20

# Instalar netcat para verificar conexiones y tzdata para zona horaria
RUN apk add --no-cache netcat-openbsd tzdata

# Configurar zona horaria
ENV TZ=America/Lima
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm install --only=production

# Copiar el resto del código fuente
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads

# Hacer ejecutable el script de inicio
RUN chmod +x start.sh

# Cambiar propietario de los archivos al usuario node
RUN chown -R node:node /app
USER node

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["./start.sh"]
