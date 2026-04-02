"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireSuperAdmin = requireSuperAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../env");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!token)
        return res.status(401).json({ error: "Non authentifié" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = {
            id: payload.sub,
            role: payload.role,
            prenom: payload.prenom,
            nom: payload.nom,
            telephone: payload.telephone,
            email: payload.email,
            accessPressing: payload.accessPressing,
            accessAtelier: payload.accessAtelier,
        };
        return next();
    }
    catch {
        return res.status(401).json({ error: "Token invalide" });
    }
}
function requireSuperAdmin(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!token)
        return res.status(401).json({ error: "Non authentifié" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        if (payload.role !== "SUPER_ADMIN") {
            return res.status(403).json({ error: "Accès réservé au Super Admin" });
        }
        req.user = {
            id: payload.sub,
            role: payload.role,
            prenom: payload.prenom,
            nom: payload.nom,
            telephone: payload.telephone,
            email: payload.email,
            accessPressing: payload.accessPressing,
            accessAtelier: payload.accessAtelier,
        };
        return next();
    }
    catch {
        return res.status(401).json({ error: "Token invalide" });
    }
}
