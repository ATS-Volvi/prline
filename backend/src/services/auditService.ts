import { AuditLog } from "../../../../database/models/models";

export const logAction = async (actionType: string, details: string, userId = "admin-user", userRole = "Plant Admin") => {
  try {
    await AuditLog.create({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actionType,
      details,
      userId,
      userRole
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};
