const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // authMiddleware must run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Master (super_admin) has full access to all resources
    if (req.user.role === "super_admin") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
