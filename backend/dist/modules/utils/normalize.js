"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
exports.normalizeTelephone = normalizeTelephone;
function normalizeEmail(email) {
    if (!email)
        return null;
    const normalized = email.trim().toLowerCase();
    return normalized.length ? normalized : null;
}
function normalizeTelephone(telephone) {
    if (!telephone)
        return null;
    const normalized = telephone.trim().replace(/[\s.-]/g, "");
    return normalized.length ? normalized : null;
}
