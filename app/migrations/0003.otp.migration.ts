import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("otps", {
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

    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    purpose: {
      type: DataTypes.ENUM(
        "password_reset",
        "email_verification",
        "2fa",
        "phone_verification",
      ),
      allowNull: false,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
  await queryInterface.addIndex("otps", ["user_id"], {
    name: "otps_user_id_idx",
  });

  await queryInterface.addIndex("otps", ["purpose"], {
    name: "otps_purpose_idx",
  });

  await queryInterface.addIndex("otps", ["used"], {
    name: "otps_used_idx",
  });

  await queryInterface.addIndex("otps", ["expires_at"], {
    name: "otps_expires_at_idx",
  });

  await queryInterface.addIndex("otps", ["code"], {
    name: "otps_code_idx",
  });

  // Composite index for common queries
  await queryInterface.addIndex(
    "otps",
    ["user_id", "purpose", "used", "expires_at"],
    {
      name: "otps_verification_idx",
    },
  );
}
export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("otps");
}
