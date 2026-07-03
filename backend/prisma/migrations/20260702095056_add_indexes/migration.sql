/*
  Warnings:

  - You are about to drop the column `ingredients` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the `SeasonalFood` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `ConversationMemory` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `value` on the `ConversationMemory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ConversationMemory" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "importance" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "lastAccessed" TIMESTAMP(3),
ADD COLUMN     "source" TEXT,
ADD COLUMN     "tags" TEXT[],
DROP COLUMN "value",
ADD COLUMN     "value" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "FoodPreference" ADD COLUMN     "budgetPreference" TEXT,
ADD COLUMN     "cheatDay" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "preferredCookingStyle" TEXT,
ADD COLUMN     "preferredMealTime" TEXT,
ADD COLUMN     "spiceLevel" TEXT;

-- AlterTable
ALTER TABLE "HealthProfile" ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "bmi" DOUBLE PRECISION,
ADD COLUMN     "bodyFat" DOUBLE PRECISION,
ADD COLUMN     "dailyCalories" INTEGER,
ADD COLUMN     "dailyWaterGoal" INTEGER,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "medications" TEXT[],
ADD COLUMN     "sleepHours" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "LocationPreference" ADD COLUMN     "country" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "MealHistory" ADD COLUMN     "carbs" DOUBLE PRECISION,
ADD COLUMN     "cookedBy" TEXT,
ADD COLUMN     "fats" DOUBLE PRECISION,
ADD COLUMN     "fullness" INTEGER,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "moodAfter" TEXT,
ADD COLUMN     "moodBefore" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "water" INTEGER;

-- AlterTable
ALTER TABLE "PantryItem" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "storageLocation" TEXT;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "ingredients";

-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "exerciseTime" TEXT,
ADD COLUMN     "sleepTime" TEXT,
ADD COLUMN     "wakeTime" TEXT,
ADD COLUMN     "workEnd" TEXT,
ADD COLUMN     "workStart" TEXT;

-- DropTable
DROP TABLE "SeasonalFood";

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cuisine" TEXT,
    "season" TEXT,
    "region" TEXT,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodNutrition" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "sugar" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "calcium" DOUBLE PRECISION,
    "iron" DOUBLE PRECISION,
    "vitaminA" DOUBLE PRECISION,
    "vitaminC" DOUBLE PRECISION,
    "vitaminD" DOUBLE PRECISION,

    CONSTRAINT "FoodNutrition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "healthConscious" BOOLEAN NOT NULL DEFAULT false,
    "communicationStyle" TEXT DEFAULT 'casual',
    "preferredResponseLength" TEXT DEFAULT 'medium',
    "dailySummaryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mealSuggestionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "likesVoiceReply" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHabit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habit" TEXT NOT NULL,
    "frequency" TEXT,
    "preferredTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHabit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Food_name_key" ON "Food"("name");

-- CreateIndex
CREATE INDEX "Food_category_idx" ON "Food"("category");

-- CreateIndex
CREATE INDEX "Food_cuisine_idx" ON "Food"("cuisine");

-- CreateIndex
CREATE INDEX "Food_season_idx" ON "Food"("season");

-- CreateIndex
CREATE INDEX "Food_region_idx" ON "Food"("region");

-- CreateIndex
CREATE INDEX "Food_isVegetarian_idx" ON "Food"("isVegetarian");

-- CreateIndex
CREATE UNIQUE INDEX "FoodNutrition_foodId_key" ON "FoodNutrition"("foodId");

-- CreateIndex
CREATE INDEX "Ingredient_foodId_idx" ON "Ingredient"("foodId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_foodId_idx" ON "RecipeIngredient"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "AIProfile_userId_key" ON "AIProfile"("userId");

-- CreateIndex
CREATE INDEX "UserGoal_userId_idx" ON "UserGoal"("userId");

-- CreateIndex
CREATE INDEX "UserGoal_isActive_idx" ON "UserGoal"("isActive");

-- CreateIndex
CREATE INDEX "UserHabit_userId_idx" ON "UserHabit"("userId");

-- CreateIndex
CREATE INDEX "FoodRating_userId_idx" ON "FoodRating"("userId");

-- CreateIndex
CREATE INDEX "FoodRating_foodId_idx" ON "FoodRating"("foodId");

-- CreateIndex
CREATE INDEX "FoodRating_rating_idx" ON "FoodRating"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "FoodRating_userId_foodId_key" ON "FoodRating"("userId", "foodId");

-- CreateIndex
CREATE INDEX "AIFeedback_userId_idx" ON "AIFeedback"("userId");

-- CreateIndex
CREATE INDEX "AIFeedback_accepted_idx" ON "AIFeedback"("accepted");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_actionType_idx" ON "ActivityLog"("actionType");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_isDeleted_idx" ON "Attendance"("isDeleted");

-- CreateIndex
CREATE INDEX "ConversationMemory_userId_idx" ON "ConversationMemory"("userId");

-- CreateIndex
CREATE INDEX "ConversationMemory_category_idx" ON "ConversationMemory"("category");

-- CreateIndex
CREATE INDEX "ConversationMemory_expiresAt_idx" ON "ConversationMemory"("expiresAt");

-- CreateIndex
CREATE INDEX "ConversationMemory_key_idx" ON "ConversationMemory"("key");

-- CreateIndex
CREATE INDEX "FamilyMember_homeId_idx" ON "FamilyMember"("homeId");

-- CreateIndex
CREATE INDEX "FamilyMember_isActive_idx" ON "FamilyMember"("isActive");

-- CreateIndex
CREATE INDEX "GroceryItem_homeId_idx" ON "GroceryItem"("homeId");

-- CreateIndex
CREATE INDEX "GroceryItem_status_idx" ON "GroceryItem"("status");

-- CreateIndex
CREATE INDEX "GroceryItem_requestedById_idx" ON "GroceryItem"("requestedById");

-- CreateIndex
CREATE INDEX "GroceryItem_isDeleted_idx" ON "GroceryItem"("isDeleted");

-- CreateIndex
CREATE INDEX "Home_honourId_idx" ON "Home"("honourId");

-- CreateIndex
CREATE INDEX "Home_isDeleted_idx" ON "Home"("isDeleted");

-- CreateIndex
CREATE INDEX "InventoryItem_homeId_idx" ON "InventoryItem"("homeId");

-- CreateIndex
CREATE INDEX "InventoryItem_status_idx" ON "InventoryItem"("status");

-- CreateIndex
CREATE INDEX "InventoryItem_isDeleted_idx" ON "InventoryItem"("isDeleted");

-- CreateIndex
CREATE INDEX "MealHistory_userId_idx" ON "MealHistory"("userId");

-- CreateIndex
CREATE INDEX "MealHistory_date_idx" ON "MealHistory"("date");

-- CreateIndex
CREATE INDEX "MealHistory_mealType_idx" ON "MealHistory"("mealType");

-- CreateIndex
CREATE INDEX "MealPlan_homeId_idx" ON "MealPlan"("homeId");

-- CreateIndex
CREATE INDEX "MealPlan_date_idx" ON "MealPlan"("date");

-- CreateIndex
CREATE INDEX "MealPlan_isDeleted_idx" ON "MealPlan"("isDeleted");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "PantryItem_homeId_idx" ON "PantryItem"("homeId");

-- CreateIndex
CREATE INDEX "PantryItem_category_idx" ON "PantryItem"("category");

-- CreateIndex
CREATE INDEX "PantryItem_expiryDate_idx" ON "PantryItem"("expiryDate");

-- CreateIndex
CREATE INDEX "PantryItem_isDeleted_idx" ON "PantryItem"("isDeleted");

-- CreateIndex
CREATE INDEX "PantryItem_name_idx" ON "PantryItem"("name");

-- CreateIndex
CREATE INDEX "Recipe_createdById_idx" ON "Recipe"("createdById");

-- CreateIndex
CREATE INDEX "Recipe_isDeleted_idx" ON "Recipe"("isDeleted");

-- CreateIndex
CREATE INDEX "Recipe_name_idx" ON "Recipe"("name");

-- CreateIndex
CREATE INDEX "Reminder_userId_idx" ON "Reminder"("userId");

-- CreateIndex
CREATE INDEX "Reminder_scheduledAt_idx" ON "Reminder"("scheduledAt");

-- CreateIndex
CREATE INDEX "Reminder_isCompleted_idx" ON "Reminder"("isCompleted");

-- CreateIndex
CREATE INDEX "Reminder_isDeleted_idx" ON "Reminder"("isDeleted");

-- CreateIndex
CREATE INDEX "Report_homeId_idx" ON "Report"("homeId");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "Report"("type");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_generatedById_idx" ON "Report"("generatedById");

-- CreateIndex
CREATE INDEX "Report_isDeleted_idx" ON "Report"("isDeleted");

-- CreateIndex
CREATE INDEX "Routine_userId_idx" ON "Routine"("userId");

-- CreateIndex
CREATE INDEX "Routine_mealType_idx" ON "Routine"("mealType");

-- CreateIndex
CREATE INDEX "Setting_homeId_idx" ON "Setting"("homeId");

-- CreateIndex
CREATE INDEX "Setting_key_idx" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "Setting_isDeleted_idx" ON "Setting"("isDeleted");

-- CreateIndex
CREATE INDEX "ShoppingList_homeId_idx" ON "ShoppingList"("homeId");

-- CreateIndex
CREATE INDEX "ShoppingList_isDeleted_idx" ON "ShoppingList"("isDeleted");

-- CreateIndex
CREATE INDEX "Staff_status_idx" ON "Staff"("status");

-- CreateIndex
CREATE INDEX "Staff_staffType_idx" ON "Staff"("staffType");

-- CreateIndex
CREATE INDEX "Staff_isDeleted_idx" ON "Staff"("isDeleted");

-- CreateIndex
CREATE INDEX "Task_homeId_idx" ON "Task"("homeId");

-- CreateIndex
CREATE INDEX "Task_assignedStaffId_idx" ON "Task"("assignedStaffId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "Task_isDeleted_idx" ON "Task"("isDeleted");

-- CreateIndex
CREATE INDEX "TaskHistory_taskId_idx" ON "TaskHistory"("taskId");

-- CreateIndex
CREATE INDEX "TaskHistory_status_idx" ON "TaskHistory"("status");

-- CreateIndex
CREATE INDEX "TaskHistory_createdAt_idx" ON "TaskHistory"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "User"("isDeleted");

-- CreateIndex
CREATE INDEX "User_preferredLanguage_idx" ON "User"("preferredLanguage");

-- CreateIndex
CREATE INDEX "Visitor_homeId_idx" ON "Visitor"("homeId");

-- CreateIndex
CREATE INDEX "Visitor_hostId_idx" ON "Visitor"("hostId");

-- CreateIndex
CREATE INDEX "Visitor_status_idx" ON "Visitor"("status");

-- CreateIndex
CREATE INDEX "Visitor_checkIn_idx" ON "Visitor"("checkIn");

-- CreateIndex
CREATE INDEX "Visitor_isDeleted_idx" ON "Visitor"("isDeleted");

-- AddForeignKey
ALTER TABLE "FoodNutrition" ADD CONSTRAINT "FoodNutrition_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIProfile" ADD CONSTRAINT "AIProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHabit" ADD CONSTRAINT "UserHabit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodRating" ADD CONSTRAINT "FoodRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodRating" ADD CONSTRAINT "FoodRating_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIFeedback" ADD CONSTRAINT "AIFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
