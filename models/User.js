module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        email: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
    },)
    return User
}
