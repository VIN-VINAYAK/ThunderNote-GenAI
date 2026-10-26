const jwt = require("jsonwebtoken");
function authenticator(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "Please sign in to continue", status: 2 });
  jwt.verify(token, process.env.JWT_SECRET || "your_secret_key", (err, decode) => {
    if (err || !decode?.userID) return res.status(401).json({ message: "Invalid token, please login again", status: 2 });
    req.userID = decode.userID;
    next();
  });
}
module.exports = { authenticator };
