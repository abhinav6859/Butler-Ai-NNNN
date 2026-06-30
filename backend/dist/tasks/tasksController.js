"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const whatsappService_1 = require("../whatsapp/whatsappService");
class TasksController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const status = req.query.status;
            const priority = req.query.priority;
            const category = req.query.category;
            const staffId = req.query.assignedStaffId;
            const sortBy = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder || 'desc';
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
                AND: [
                    search
                        ? {
                            OR: [
                                { title: { contains: search, mode: 'insensitive' } },
                                { description: { contains: search, mode: 'insensitive' } },
                            ],
                        }
                        : {},
                    status ? { status: status } : {},
                    priority ? { priority: priority } : {},
                    category ? { category: category } : {},
                    staffId ? { assignedStaffId: staffId } : {},
                ],
            };
            const [tasks, total] = await Promise.all([
                client_1.default.task.findMany({
                    where,
                    include: {
                        assignedStaff: true,
                        createdBy: { select: { id: true, name: true } },
                        history: { orderBy: { createdAt: 'desc' } },
                    },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.task.count({ where }),
            ]);
            return res.json({
                data: tasks,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async get(req, res) {
        try {
            const { id } = req.params;
            const task = await client_1.default.task.findFirst({
                where: { id, isDeleted: false },
                include: {
                    assignedStaff: true,
                    createdBy: { select: { id: true, name: true } },
                    history: { orderBy: { createdAt: 'desc' } },
                },
            });
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            return res.json(task);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { title, description, priority, category, assignedStaffId, dueDate, remarks } = req.body;
            const homeId = req.user?.homeId;
            const creatorId = req.user?.id;
            if (!homeId) {
                return res.status(400).json({ error: 'User does not belong to a registered Home context' });
            }
            const task = await client_1.default.task.create({
                data: {
                    title,
                    description,
                    priority: priority || client_2.Priority.MEDIUM,
                    category,
                    assignedStaffId: assignedStaffId || null,
                    homeId,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    remarks,
                    createdById: creatorId,
                },
            });
            // Write Task History
            await client_1.default.taskHistory.create({
                data: {
                    taskId: task.id,
                    status: task.status,
                    changedById: creatorId,
                    remarks: 'Task created',
                },
            });
            // Trigger Task Assigned WhatsApp Notification
            if (task.assignedStaffId) {
                const staff = await client_1.default.staff.findUnique({
                    where: { id: task.assignedStaffId },
                    include: { user: true },
                });
                if (staff && staff.userId) {
                    const msg = `Hello ${staff.name}, a new task "${task.title}" has been assigned to you. Priority: ${task.priority}. Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}.`;
                    await whatsappService_1.WhatsAppService.sendNotification(staff.userId, 'Task Assigned', msg, 'TASK_ASSIGNED');
                }
            }
            return res.status(201).json(task);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { title, description, priority, status, category, assignedStaffId, dueDate, remarks } = req.body;
            const userId = req.user?.id;
            const task = await client_1.default.task.findFirst({ where: { id, isDeleted: false } });
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            const prevStatus = task.status;
            const prevStaffId = task.assignedStaffId;
            const updateData = {};
            if (title)
                updateData.title = title;
            if (description !== undefined)
                updateData.description = description;
            if (priority)
                updateData.priority = priority;
            if (status)
                updateData.status = status;
            if (category)
                updateData.category = category;
            if (assignedStaffId !== undefined)
                updateData.assignedStaffId = assignedStaffId;
            if (dueDate !== undefined)
                updateData.dueDate = dueDate ? new Date(dueDate) : null;
            if (remarks !== undefined)
                updateData.remarks = remarks;
            if (status === client_2.TaskStatus.COMPLETED) {
                updateData.completionDate = new Date();
            }
            const updated = await client_1.default.task.update({
                where: { id },
                data: updateData,
            });
            // Log status transition history if changed or remarks updated
            if (prevStatus !== updated.status || remarks) {
                await client_1.default.taskHistory.create({
                    data: {
                        taskId: updated.id,
                        status: updated.status,
                        changedById: userId,
                        remarks: remarks || `Status changed from ${prevStatus} to ${updated.status}`,
                    },
                });
            }
            // WhatsApp Alerts: Assignment or Completion
            if (updated.assignedStaffId && prevStaffId !== updated.assignedStaffId) {
                const staff = await client_1.default.staff.findUnique({
                    where: { id: updated.assignedStaffId },
                    include: { user: true },
                });
                if (staff && staff.userId) {
                    const msg = `Hello ${staff.name}, a new task "${updated.title}" has been assigned to you. Priority: ${updated.priority}.`;
                    await whatsappService_1.WhatsAppService.sendNotification(staff.userId, 'Task Assigned', msg, 'TASK_ASSIGNED');
                }
            }
            if (updated.status === client_2.TaskStatus.COMPLETED && prevStatus !== client_2.TaskStatus.COMPLETED) {
                // Notify the Honour
                const home = await client_1.default.home.findUnique({
                    where: { id: updated.homeId },
                    include: { honour: true },
                });
                if (home && home.honourId) {
                    const staffName = updated.assignedStaffId
                        ? (await client_1.default.staff.findUnique({ where: { id: updated.assignedStaffId } }))?.name || 'Staff'
                        : 'Unassigned';
                    const msg = `Task "${updated.title}" has been marked as COMPLETED by ${staffName}. Remarks: ${updated.remarks || 'None'}.`;
                    await whatsappService_1.WhatsAppService.sendNotification(home.honourId, 'Task Completed', msg, 'TASK_COMPLETED');
                }
            }
            return res.json(updated);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const task = await client_1.default.task.findFirst({ where: { id, isDeleted: false } });
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            await client_1.default.task.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Task deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.TasksController = TasksController;
