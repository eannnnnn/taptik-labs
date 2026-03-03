import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const lessons = sqliteTable(
  "lessons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    keywords: text("keywords").notNull().default(""),
    project_path: text("project_path").notNull(),
    file_path: text("file_path").notNull().default(""),
    content: text("content").notNull().default(""),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => ({
    uqLessonsTitleProject: uniqueIndex("uq_lessons_title_project").on(table.title, table.project_path),
    idxLessonsProjectUpdated: index("idx_lessons_project_updated").on(table.project_path, table.updated_at),
    idxLessonsUpdatedAt: index("idx_lessons_updated_at").on(table.updated_at),
  }),
);
