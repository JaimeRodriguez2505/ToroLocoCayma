// middlewares/upload.js
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Definir la carpeta de destino según el campo
        if (file.fieldname === 'logo') {
            cb(null, path.join(__dirname, '../uploads/logos'));
        } else if (file.fieldname === 'cert') {
            cb(null, path.join(__dirname, '../uploads/certs'));
        } else if (file.fieldname === 'imagen') {
            cb(null, path.join(__dirname, '../uploads/productos'));
        } else if (file.fieldname === 'imagen_categoria') {
            cb(null, path.join(__dirname, '../uploads/categorias'));
        } else if (file.fieldname === 'imagen_banner') {
            cb(null, path.join(__dirname, '../uploads/banner'));
        } else if (file.fieldname === 'imagen_tarjeta') {
            cb(null, path.join(__dirname, '../uploads/tarjetas'));
        } else if (file.fieldname === 'comprobante_reserva') {
            cb(null, path.join(__dirname, '../uploads/reservas'));
        } else {
            cb(new Error('Tipo de archivo no permitido'), null);
        }
    },
    filename: (req, file, cb) => {
        // Generar un nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// Opciones adicionales, si lo necesitas
const fileFilter = (req, file, cb) => {
    console.log(file.mimetype)
    // Por ejemplo, para permitir solo imágenes en el logo y .pem o .txt en cert
    if (file.fieldname === 'logo') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para el logo'));
        }
    } else if (file.fieldname === 'cert') {
        if (file.mimetype === 'application/x-pem-file' || file.mimetype === 'text/plain' || file.mimetype === 'application/x-x509-ca-cert'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos pem o txt para el certificado'));
        }
    } else if (file.fieldname === 'imagen') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para el producto'));
        }
    } else if (file.fieldname === 'imagen_categoria') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para la categoría'));
        }
    } else if (file.fieldname === 'imagen_banner') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para el banner'));
        }
    } else if (file.fieldname === 'imagen_tarjeta') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para la tarjeta'));
        }
    } else if (file.fieldname === 'comprobante_reserva') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para el comprobante'));
        }
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;
