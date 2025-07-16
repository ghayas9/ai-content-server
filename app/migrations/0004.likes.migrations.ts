import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("likes", {
    // Primary key identifier for the like record
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // Foreign key reference to the user who liked the content
    user_id: {
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
    content_id: {
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    // Timestamp when the like was last updated
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    // Soft delete timestamp - null means active, date means deleted
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create indexes
  // Index for fast lookup of likes by user
  await queryInterface.addIndex("likes", ["user_id"], {
    name: "likes_user_id_idx",
  });

  // Index for fast lookup of likes by content
  await queryInterface.addIndex("likes", ["content_id"], {
    name: "likes_content_id_idx",
  });

  // Index for sorting likes by creation date
  await queryInterface.addIndex("likes", ["created_at"], {
    name: "likes_created_at_idx",
  });

  // Composite unique index to prevent a user from liking the same content multiple times
  await queryInterface.addIndex("likes", ["user_id", "content_id"], {
    unique: true,
    name: "likes_user_content_unique_idx",
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("likes");
}
