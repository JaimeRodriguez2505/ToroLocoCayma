'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('companies', 'reniec_api_key', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'API Key para consultas RENIEC'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('companies', 'reniec_api_key');
  }
};
