-- CreateTable: Promotion
CREATE TABLE "Promotion" (
    "id"          TEXT         NOT NULL,
    "kioskId"     TEXT         NOT NULL,
    "title"       TEXT         NOT NULL,
    "description" TEXT,
    "minVisits"   INTEGER      NOT NULL DEFAULT 1,
    "active"      BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Redemption
CREATE TABLE "Redemption" (
    "id"          TEXT         NOT NULL,
    "promotionId" TEXT         NOT NULL,
    "playerId"    TEXT         NOT NULL,
    "code"        TEXT         NOT NULL,
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "redeemedAt"  TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promotion_kioskId_active_idx" ON "Promotion"("kioskId", "active");
CREATE UNIQUE INDEX "Redemption_code_key" ON "Redemption"("code");
CREATE INDEX "Redemption_code_idx" ON "Redemption"("code");
CREATE INDEX "Redemption_playerId_promotionId_idx" ON "Redemption"("playerId", "promotionId");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_kioskId_fkey"
    FOREIGN KEY ("kioskId") REFERENCES "Kiosk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_promotionId_fkey"
    FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
