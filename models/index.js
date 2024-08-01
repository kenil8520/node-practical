const dbConfig = require('../config/dbConfig.js')

const {Sequelize, DataTypes} = require('sequelize')

const sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,{
        host:dbConfig.HOST,
        dialect:dbConfig.dialect,
    }
)

sequelize.authenticate()
.then(() => {

})
.catch((error) =>{
    console.log("error", error);
})

const db = {}

db.sequelize = Sequelize
db.sequelize = sequelize


db.user = require('./user.js')(sequelize, DataTypes)
db.postcard = require('./Postcard.js')(sequelize, DataTypes)

db.sequelize.sync({ force:false })

module.exports = db
