const axios = require('axios');

const getDniData = async (req, res) => {
    const { dni } = req.params;

    if(!/^\d{8}$/.test(dni)) {
        return res.status(400).json({ message: "DNI inválido" });
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
            `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        )

        const { first_name, first_last_name, second_last_name, full_name, document_number } = data;

        return res.json({
            first_name,
            first_last_name,
            second_last_name,
            full_name,
            document_number
        });

    }catch (error) {
        console.error('Error obteniendo datos de RENIEC:', error.message);
        const status = error.response?.status || 500;
        return res.status(status).json({
          error: 'No se pudo obtener información para ese DNI'
        });
    }
}

module.exports = {
    getDniData,
};