import { Op } from "sequelize";
import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("users", {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },

    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },

    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    profile_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    cover_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive", "blocked"),
      defaultValue: "active",
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
      allowNull: false,
    },

    referral_code: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true,
    },

    referred_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    credits: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
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
  await queryInterface.addIndex("users", ["id"], {
    unique: true,
    name: "users_id_idx",
  });

  await queryInterface.addIndex("users", ["email"], {
    unique: true,
    name: "users_email_idx",
  });

  await queryInterface.addIndex("users", ["status"], {
    name: "users_status_idx",
  });

  await queryInterface.addIndex("users", ["referral_code"], {
    unique: true,
    name: "users_referral_code_idx",
    where: {
      referral_code: {
        [Op.ne]: null,
      },
    },
  });

  await queryInterface.addIndex("users", ["credits"], {
    name: "users_credits_idx",
  });

  await queryInterface.addIndex("users", ["email_verified"], {
    name: "users_email_verified_idx",
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("users");
}
