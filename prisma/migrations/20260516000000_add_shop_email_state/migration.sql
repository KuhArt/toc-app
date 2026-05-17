-- CreateTable
CREATE TABLE "Shop" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "contactEmail" TEXT,
    "installedAt" TIMESTAMP(3),
    "uninstalledAt" TIMESTAMP(3),
    "welcomeEmailSentAt" TIMESTAMP(3),
    "uninstallEmailSentAt" TIMESTAMP(3)
);
