const axios = require('axios');

const getRucData = async (req, res) => {
    const { ruc } = req.params;

    if(!/^\d{11}$/.test(ruc)) {
        return res.status(400).json({ message: "RUC inválido" });
    }

    try{
        // Obtener la API key de la empresa del usuario
        const Company = require('../models/company.model');
        const company = await Company.findOne({
            where: { id_user: req.user.id }
        });

        if (!company || !company.reniec_api_key) {
            return res.status(400).json({ 
                error: "API Key de RENIEC no configurada. Configure su API Key en la información de la empresa." 
            });
        }

        const token = company.reniec_api_key;
        const {data} = await axios.get(
            `https://api.decolecta.com/v1/sunat/ruc?numero=${ruc}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        )

        const { 
            razon_social, 
            numero_documento, 
            estado, 
            condicion, 
            direccion, 
            ubigeo,
            via_tipo,
            via_nombre,
            zona_codigo,
            zona_tipo,
            numero,
            interior,
            lote,
            dpto,
            manzana,
            kilometro,
            distrito, 
            provincia, 
            departamento,
            es_agente_retencion,
            es_buen_contribuyente,
            locales_anexos
        } = data;

        return res.json({
            razon_social,
            numero_documento,
            estado,
            condicion,
            direccion,
            ubigeo,
            via_tipo,
            via_nombre,
            zona_codigo,
            zona_tipo,
            numero,
            interior,
            lote,
            dpto,
            manzana,
            kilometro,
            distrito,
            provincia,
            departamento,
            es_agente_retencion,
            es_buen_contribuyente,
            locales_anexos
        });

    }catch (error) {
        console.error("Error al obtener datos del RUC:", error.message);
        return res.status(500).json({ message: "Error al obtener datos del RUC" });
    }
}

module.exports = {
    getRucData,
};