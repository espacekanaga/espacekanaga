"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
function requireRoles(...allowed) {
    return function roleGuard(req, res, next) {
        const role = req.user?.role;
        if (!role)
            return res.status(401).json({ error: "Non authentifié" });
        if (!allowed.includes(role))
            return res.status(403).json({ error: "Accès refusé" });
        return next();
    };
}
