import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./user.models";
import Content from "./content.models";

// Define comment status
export type TCommentStatus = "active" | "hidden" | "reported" | "deleted";

// Comment attributes interface
interface CommentAttributes {
  id: string;
  userId: string;
  contentId: string;
  parentId: string | null;
  text: string;
  status: TCommentStatus;
  isPinned: boolean;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Attributes for comment creation
interface CommentCreationAttributes
  extends Optional<
    CommentAttributes,
    | "id"
    | "parentId"
    | "status"
    | "isPinned"
    | "metadata"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

export class Comment
  extends Model<CommentAttributes, CommentCreationAttributes>
  implements CommentAttributes
{
  public id!: string;
  public userId!: string;
  public contentId!: string;
  public parentId!: string | null;
  public text!: string;
  public status!: TCommentStatus;
  public isPinned!: boolean;
  public metadata!: Record<string, any> | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  // Define associations
  public readonly user?: User;
  public readonly content?: Content;
  public readonly parent?: Comment;
  public readonly replies?: Comment[];
}

Comment.init(
  {
    // Primary key identifier for the comment record
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // Foreign key reference to the user who posted the comment
    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    // Foreign key reference to the content being commented on
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "contents",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    // Foreign key reference to parent comment for nested replies (null for top-level comments)
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "comments",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    // The actual comment text content
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 10000], // Max 10,000 characters
      },
    },
    // Status of the comment for moderation purposes
    status: {
      type: DataTypes.ENUM("active", "hidden", "reported", "deleted"),
      allowNull: false,
      defaultValue: "active",
    },
    // Whether this comment is pinned by moderators/admins
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Additional data that can be stored as JSON (mentions, attachments, etc.)
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Timestamp when the comment was created
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // Timestamp when the comment was last updated
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // Soft delete timestamp - null means active, date means deleted
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "comments",
    timestamps: true,
    paranoid: true, // Enables soft deletes
    underscored: true, // This will convert camelCase to snake_case in DB
    indexes: [
      {
        name: "comments_user_id_idx",
        fields: ["user_id"],
      },
      {
        name: "comments_content_id_idx",
        fields: ["content_id"],
      },
      {
        name: "comments_parent_id_idx",
        fields: ["parent_id"],
      },
      {
        name: "comments_status_idx",
        fields: ["status"],
      },
      {
        name: "comments_created_at_idx",
        fields: ["created_at"],
      },
      {
        name: "comments_is_pinned_idx",
        fields: ["is_pinned"],
      },
      {
        name: "comments_content_status_created_idx",
        fields: ["content_id", "status", "created_at"],
      },
      {
        name: "comments_parent_created_idx",
        fields: ["parent_id", "created_at"],
      },
    ],
  },
);

// Define associations
Comment.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Comment.belongsTo(Content, {
  foreignKey: "contentId",
  as: "content",
});

Comment.belongsTo(Comment, {
  foreignKey: "parentId",
  as: "parent",
});

Comment.hasMany(Comment, {
  foreignKey: "parentId",
  as: "replies",
});

User.hasMany(Comment, {
  foreignKey: "userId",
  as: "comments",
});

Content.hasMany(Comment, {
  foreignKey: "contentId",
  as: "comments",
});

export default Comment;
