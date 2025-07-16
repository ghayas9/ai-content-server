import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./user.models";
import Content from "./content.models";

// Like attributes interface
interface LikeAttributes {
  id: string;
  userId: string;
  contentId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Attributes for like creation
interface LikeCreationAttributes
  extends Optional<
    LikeAttributes,
    "id" | "createdAt" | "updatedAt" | "deletedAt"
  > {}

export class Like
  extends Model<LikeAttributes, LikeCreationAttributes>
  implements LikeAttributes
{
  public id!: string;
  public userId!: string;
  public contentId!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  // Define associations
  public readonly user?: User;
  public readonly content?: Content;
}

Like.init(
  {
    // Primary key identifier for the like record
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // Foreign key reference to the user who liked the content
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
    // Foreign key reference to the content that was liked
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
    // Timestamp when the like was created
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // Timestamp when the like was last updated
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
    tableName: "likes",
    timestamps: true,
    paranoid: true, // Enables soft deletes
    underscored: true, // This will convert camelCase to snake_case in DB
    indexes: [
      {
        name: "likes_user_id_idx",
        fields: ["user_id"],
      },
      {
        name: "likes_content_id_idx",
        fields: ["content_id"],
      },
      {
        name: "likes_created_at_idx",
        fields: ["created_at"],
      },
      {
        name: "likes_user_content_unique_idx",
        fields: ["user_id", "content_id"],
        unique: true,
      },
    ],
  },
);

// Define associations
Like.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Like.belongsTo(Content, {
  foreignKey: "contentId",
  as: "content",
});

User.hasMany(Like, {
  foreignKey: "userId",
  as: "likes",
});

Content.hasMany(Like, {
  foreignKey: "contentId",
  as: "likes",
});

export default Like;
