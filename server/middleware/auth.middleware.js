import { verifyToken } from "../config/jwt.config.js";

export const authenticate = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token)
    return res.status(401).json({ message: "Authentication required" });

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.clearCookie("token");
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
