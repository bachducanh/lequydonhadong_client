-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'TEACHER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Tone" AS ENUM ('BRAND', 'NEUTRAL', 'SUCCESS', 'WARNING', 'DANGER');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'SPAM');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'ANSWERED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'SEEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ClubStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BannerPosition" AS ENUM ('HOME', 'SIDEBAR', 'FOOTER');

-- CreateEnum
CREATE TYPE "LinkPosition" AS ENUM ('HOME', 'FOOTER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "department" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "showInMenu" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT,
    "imageCaption" TEXT,
    "categoryId" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "badge" TEXT,
    "badgeTone" "Tone",
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "content" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "effective" BOOLEAN NOT NULL DEFAULT true,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TickerItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "link" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TickerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slide" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "lead" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "secondaryLabel" TEXT,
    "secondaryHref" TEXT,
    "image" TEXT,
    "imageAlt" TEXT,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "schoolYear" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumPhoto" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "allowedFormats" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "typeId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "externalUrl" TEXT,
    "thumbnail" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DownloadFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "askerName" TEXT NOT NULL,
    "askerRole" TEXT,
    "askerEmail" TEXT,
    "topic" TEXT NOT NULL,
    "answer" TEXT,
    "answeredBy" TEXT,
    "answeredAt" TIMESTAMP(3),
    "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING',
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "note" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "hobbies" TEXT,
    "language" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "introduction" TEXT,
    "status" "ClubStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT,
    "description" TEXT,
    "ctaLabel" TEXT,
    "link" TEXT,
    "image" TEXT,
    "size" TEXT,
    "position" "BannerPosition" NOT NULL DEFAULT 'HOME',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "sub" TEXT,
    "icon" TEXT,
    "position" "LinkPosition" NOT NULL DEFAULT 'HOME',
    "openNewTab" BOOLEAN NOT NULL DEFAULT true,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_status_publishedAt_idx" ON "Post"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Post_categoryId_idx" ON "Post"("categoryId");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryType_slug_key" ON "LibraryType"("slug");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumPhoto" ADD CONSTRAINT "AlbumPhoto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "LibraryType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
