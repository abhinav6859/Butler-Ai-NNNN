"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
// Route Imports
const authRoute_1 = __importDefault(require("./auth/authRoute"));
const usersRoute_1 = __importDefault(require("./users/usersRoute"));
const homesRoute_1 = __importDefault(require("./homes/homesRoute"));
const staffRoute_1 = __importDefault(require("./staff/staffRoute"));
const tasksRoute_1 = __importDefault(require("./tasks/tasksRoute"));
const attendanceRoute_1 = __importDefault(require("./attendance/attendanceRoute"));
const visitorsRoute_1 = __importDefault(require("./visitors/visitorsRoute"));
const pantryRoute_1 = __importDefault(require("./pantry/pantryRoute"));
const recipesRoute_1 = __importDefault(require("./recipes/recipesRoute"));
const mealPlansRoute_1 = __importDefault(require("./meal-plans/mealPlansRoute"));
const groceriesRoute_1 = __importDefault(require("./groceries/groceriesRoute"));
const inventoryRoute_1 = __importDefault(require("./inventory/inventoryRoute"));
const notificationsRoute_1 = __importDefault(require("./notifications/notificationsRoute"));
const reportsRoute_1 = __importDefault(require("./reports/reportsRoute"));
const settingsRoute_1 = __importDefault(require("./settings/settingsRoute"));
const aiRoute_1 = __importDefault(require("./ai/aiRoute"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Setup Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Base health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Butler AI Backend Service is running' });
});
// Setup REST Routes
app.use('/api/auth', authRoute_1.default);
app.use('/api/users', usersRoute_1.default);
app.use('/api/homes', homesRoute_1.default);
app.use('/api/staff', staffRoute_1.default);
app.use('/api/tasks', tasksRoute_1.default);
app.use('/api/attendance', attendanceRoute_1.default);
app.use('/api/visitors', visitorsRoute_1.default);
app.use('/api/pantry', pantryRoute_1.default);
app.use('/api/recipes', recipesRoute_1.default);
app.use('/api/meal-plans', mealPlansRoute_1.default);
app.use('/api/groceries', groceriesRoute_1.default);
app.use('/api/inventory', inventoryRoute_1.default);
app.use('/api/notifications', notificationsRoute_1.default);
app.use('/api/reports', reportsRoute_1.default);
app.use('/api/settings', settingsRoute_1.default);
app.use('/api/ai', aiRoute_1.default);
// Error Handling Middleware
app.use(errorMiddleware_1.errorMiddleware);
// Listen
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(` Butler AI Server is listening on Port ${PORT}`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});
