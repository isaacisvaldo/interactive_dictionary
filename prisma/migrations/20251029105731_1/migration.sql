-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'pt',
    "phonetic" TEXT,
    "audioUrl" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Definition" (
    "id" SERIAL NOT NULL,
    "meaning" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "wordId" INTEGER NOT NULL,

    CONSTRAINT "Definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Example" (
    "id" SERIAL NOT NULL,
    "sentence" TEXT NOT NULL,
    "translation" TEXT,
    "definitionId" INTEGER NOT NULL,

    CONSTRAINT "Example_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Synonym" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,
    "wordId" INTEGER NOT NULL,

    CONSTRAINT "Synonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Antonym" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,
    "wordId" INTEGER NOT NULL,

    CONSTRAINT "Antonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "wordId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Word_term_key" ON "Word"("term");

-- AddForeignKey
ALTER TABLE "Definition" ADD CONSTRAINT "Definition_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Example" ADD CONSTRAINT "Example_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "Definition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Synonym" ADD CONSTRAINT "Synonym_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antonym" ADD CONSTRAINT "Antonym_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
