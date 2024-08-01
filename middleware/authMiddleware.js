const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    try{
        let token;
        let authHeader = req.headers.Authorization || req.headers.authorization;
        if (!authHeader){
            res.status(401).json({success : false, message: 'Authentication token missing'})
        }
        if (authHeader && authHeader.startsWith("Bearer")) {
        token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({success : false, message: 'Unauthorized user'})
            }
            req.user = decoded.user;
            next();
        });

        if (!token) {
            res.status(401);
            throw new Error("User not authorized or token is missing");
        }
        }
    }catch(error){
        console.log(error);
    }
}
module.exports = verifyToken;
