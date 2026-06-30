import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorMiddleware } from './middleware/errorMiddleware';

// Route Imports
import authRoute from './auth/authRoute';
import usersRoute from './users/usersRoute';
import homesRoute from './homes/homesRoute';
import staffRoute from './staff/staffRoute';
import tasksRoute from './tasks/tasksRoute';
import attendanceRoute from './attendance/attendanceRoute';
import visitorsRoute from './visitors/visitorsRoute';
import pantryRoute from './pantry/pantryRoute';
import recipesRoute from './recipes/recipesRoute';
import mealPlansRoute from './meal-plans/mealPlansRoute';
import groceriesRoute from './groceries/groceriesRoute';
import inventoryRoute from './inventory/inventoryRoute';
import notificationsRoute from './notifications/notificationsRoute';
import reportsRoute from './reports/reportsRoute';
import settingsRoute from './settings/settingsRoute';
import aiRoute from './ai/aiRoute';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middlewares
app.use(cors());
app.use(express.json());

// Base health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Butler AI Backend Service is running' });
});

// Setup REST Routes
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/homes', homesRoute);
app.use('/api/staff', staffRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/attendance', attendanceRoute);
app.use('/api/visitors', visitorsRoute);
app.use('/api/pantry', pantryRoute);
app.use('/api/recipes', recipesRoute);
app.use('/api/meal-plans', mealPlansRoute);
app.use('/api/groceries', groceriesRoute);
app.use('/api/inventory', inventoryRoute);
app.use('/api/notifications', notificationsRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/settings', settingsRoute);
app.use('/api/ai', aiRoute);

// Error Handling Middleware
app.use(errorMiddleware);

// Listen
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` Butler AI Server is listening on Port ${PORT}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
