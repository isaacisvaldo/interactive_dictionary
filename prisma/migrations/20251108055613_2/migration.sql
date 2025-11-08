-- DropForeignKey
ALTER TABLE "public"."Antonym" DROP CONSTRAINT "Antonym_wordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Definition" DROP CONSTRAINT "Definition_wordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Example" DROP CONSTRAINT "Example_definitionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Media" DROP CONSTRAINT "Media_wordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Synonym" DROP CONSTRAINT "Synonym_wordId_fkey";

-- AddForeignKey
ALTER TABLE "Definition" ADD CONSTRAINT "Definition_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Example" ADD CONSTRAINT "Example_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "Definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Synonym" ADD CONSTRAINT "Synonym_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antonym" ADD CONSTRAINT "Antonym_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
