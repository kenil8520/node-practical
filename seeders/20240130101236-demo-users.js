'use strict';
const bcrypt = require('bcrypt');

const isStrongPassword = (password) => {
  const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const userData = [
      { email: 'admin@gmail.com', password: 'Admin@123' },
      { email: 'demo@gmail.com', password: 'Demo@123' },
      // { email: 'test@gmail.com', password: 'test' },
    ];

    for (const user of userData) {
      if (!isStrongPassword(user.password)) {
        throw new Error(`Password for ${user.email} does not meet strength criteria.`);
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);

      const existingUser = await queryInterface.sequelize.query(
        `SELECT * FROM Users WHERE email = '${user.email}' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!existingUser || existingUser.length === 0) {
        await queryInterface.bulkInsert('Users', [
          {
            email: user.email,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])}
        else {
          await queryInterface.sequelize.query(
            `UPDATE Users SET password = '${hashedPassword}' WHERE email = '${user.email}'`
          );

      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
