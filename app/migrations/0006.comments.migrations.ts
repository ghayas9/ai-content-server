import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("comments", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

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

    parent_id: {
      type: DataTypes.UUID,
      allowNull: true, // For nested comments/replies
      references: {
        model: "comments",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("active", "hidden", "reported", "deleted"),
      defaultValue: "active",
      allowNull: false,
    },

    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create indexes
  // Index for fast lookup of comments by user
  await queryInterface.addIndex("comments", ["user_id"], {
    name: "comments_user_id_idx",
  });

  // Index for fast lookup of comments by content
  await queryInterface.addIndex("comments", ["content_id"], {
    name: "comments_content_id_idx",
  });

  // Index for fast lookup of reply comments by parent comment
  await queryInterface.addIndex("comments", ["parent_id"], {
    name: "comments_parent_id_idx",
  });

  // Index for filtering comments by status (active, hidden, reported, deleted)
  await queryInterface.addIndex("comments", ["status"], {
    name: "comments_status_idx",
  });

  // Index for sorting comments by creation date
  await queryInterface.addIndex("comments", ["created_at"], {
    name: "comments_created_at_idx",
  });

  // Index for quickly finding pinned comments
  await queryInterface.addIndex("comments", ["is_pinned"], {
    name: "comments_is_pinned_idx",
  });

  // Composite index for common queries: get active comments for content sorted by date
  await queryInterface.addIndex(
    "comments",
    ["content_id", "status", "created_at"],
    {
      name: "comments_content_status_created_idx",
    },
  );

  // Composite index for nested comment queries: get replies for a parent comment
  await queryInterface.addIndex("comments", ["parent_id", "created_at"], {
    name: "comments_parent_created_idx",
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("comments");
}
