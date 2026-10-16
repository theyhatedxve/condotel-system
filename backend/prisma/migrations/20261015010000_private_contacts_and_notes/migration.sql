-- AlterTable
CREATE TABLE "PrivacyState" ("id" INTEGER NOT NULL PRIMARY KEY, "keyCheck" TEXT NOT NULL);

ALTER TABLE "GuestProfile" ADD COLUMN "addressAuthTag" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "addressCiphertext" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "addressIv" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "cityAuthTag" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "cityCiphertext" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "cityIv" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "emergencyContactNameAuthTag" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "emergencyContactNameCiphertext" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "emergencyContactNameIv" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "emergencyContactPhoneAuthTag" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "emergencyContactPhoneCiphertext" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "emergencyContactPhoneIv" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "postalCodeAuthTag" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "postalCodeCiphertext" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "postalCodeIv" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "provinceAuthTag" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "provinceCiphertext" TEXT;
ALTER TABLE "GuestProfile" ADD COLUMN "provinceIv" TEXT;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "specialRequestsAuthTag" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "specialRequestsCiphertext" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "specialRequestsIv" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "emailCiphertext" TEXT,
    "emailIv" TEXT,
    "emailAuthTag" TEXT,
    "emailBlindIndex" TEXT,
    "phoneCiphertext" TEXT,
    "phoneIv" TEXT,
    "phoneAuthTag" TEXT,
    "phoneBlindIndex" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" DATETIME,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "firstName", "id", "lastLoginAt", "lastName", "mustChangePassword", "passwordHash", "phone", "role", "status", "updatedAt", "username") SELECT "createdAt", "email", "firstName", "id", "lastLoginAt", "lastName", "mustChangePassword", "passwordHash", "phone", "role", "status", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_emailBlindIndex_key" ON "User"("emailBlindIndex");
CREATE INDEX "User_phoneBlindIndex_idx" ON "User"("phoneBlindIndex");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_lastName_firstName_idx" ON "User"("lastName", "firstName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
