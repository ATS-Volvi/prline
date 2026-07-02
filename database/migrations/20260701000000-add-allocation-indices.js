module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('allocations', ['date']);
    await queryInterface.addIndex('allocations', ['shiftId']);
    await queryInterface.addIndex('allocations', ['date', 'shiftId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('allocations', ['date']);
    await queryInterface.removeIndex('allocations', ['shiftId']);
    await queryInterface.removeIndex('allocations', ['date', 'shiftId']);
  }
};
