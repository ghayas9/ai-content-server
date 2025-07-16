import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("contents", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(300),
      unique: true,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    type: {
      type: DataTypes.ENUM("generated", "upload"),
      allowNull: false,
    },

    content_type: {
      type: DataTypes.ENUM("image", "video", "audio"),
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

    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    thumbnail_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("pending", "processing", "completed", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },

    is_private: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },

    // SEO Fields
    meta_title: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },

    meta_description: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },

    meta_keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    og_title: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },

    og_description: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },

    og_image: {
      type: DataTypes.TEXT,
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
  await queryInterface.addIndex("contents", ["slug"], {
    unique: true,
    name: "contents_slug_idx",
  });

  await queryInterface.addIndex("contents", ["user_id"], {
    name: "contents_user_id_idx",
  });

  await queryInterface.addIndex("contents", ["type"], {
    name: "contents_type_idx",
  });

  await queryInterface.addIndex("contents", ["status"], {
    name: "contents_status_idx",
  });

  await queryInterface.addIndex("contents", ["is_private"], {
    name: "contents_is_private_idx",
  });

  await queryInterface.addIndex("contents", ["created_at"], {
    name: "contents_created_at_idx",
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("contents");
}
