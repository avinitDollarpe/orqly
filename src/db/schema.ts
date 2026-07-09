import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

const ownedBy = () =>
  text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
};

export const workflows = pgTable("workflows", {
  id: text("id").primaryKey(),
  userId: ownedBy(),
  name: text("name").notNull(),
  nodes: jsonb("nodes").notNull().default([]),
  edges: jsonb("edges").notNull().default([]),
  preRequestScript: text("pre_request_script").notNull().default(""),
  preRequestEnabled: boolean("pre_request_enabled").notNull().default(true),
  ...timestamps,
});

export const savedBodies = pgTable("saved_bodies", {
  id: text("id").primaryKey(),
  userId: ownedBy(),
  name: text("name").notNull(),
  json: text("json").notNull().default("{}"),
  ...timestamps,
});

export const headerSets = pgTable("header_sets", {
  id: text("id").primaryKey(),
  userId: ownedBy(),
  name: text("name").notNull(),
  headers: jsonb("headers").notNull().default([]),
  ...timestamps,
});

export const environments = pgTable("environments", {
  id: text("id").primaryKey(),
  userId: ownedBy(),
  name: text("name").notNull(),
  vars: jsonb("vars").notNull().default([]),
  ...timestamps,
});
