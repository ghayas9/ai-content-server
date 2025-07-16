import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("views", {
    // Primary key identifier for the view record
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // Foreign key reference to the content that was viewed
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

    // IP address of the viewer (IPv6 support with 45 characters)
    ip_address: {
      type: DataTypes.STRING(45), // IPv6 support
      allowNull: false,
    },

    // Browser information
    // Name of the browser (e.g., "Chrome", "Firefox", "Safari")
    browser_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Version of the browser (e.g., "118.0", "119.0.1")
    browser_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Device information
    // Type of device used to view the content
    device_type: {
      type: DataTypes.ENUM("desktop", "mobile", "tablet", "unknown"),
      allowNull: true,
    },

    // Brand of the device (e.g., "Apple", "Samsung", "Google")
    device_brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Model of the device (e.g., "iPhone 15", "Galaxy S23", "MacBook Pro")
    device_model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Operating system information
    // Name of the operating system (e.g., "iOS", "Android", "Windows", "macOS")
    os_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Version of the operating system (e.g., "17.1", "14.0", "11")
    os_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Screen information
    // Screen resolution of the device (e.g., "1920x1080", "390x844")
    screen_resolution: {
      type: DataTypes.STRING(20), // e.g., "1920x1080"
      allowNull: true,
    },

    // Location information
    // Country where the view originated from
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // City where the view originated from
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Additional details
    // Complete user agent string for detailed analysis
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // URL of the page that referred the user to this content
    referrer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Timestamp when the view was recorded
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    // Timestamp when the view record was last updated
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
  // Index for fast lookup of views by content
  await queryInterface.addIndex("views", ["content_id"], {
    name: "views_content_id_idx",
  });

  // Index for fast lookup of views by IP address
  await queryInterface.addIndex("views", ["ip_address"], {
    name: "views_ip_address_idx",
  });

  // Index for analytics queries by device type
  await queryInterface.addIndex("views", ["device_type"], {
    name: "views_device_type_idx",
  });

  // Index for analytics queries by browser
  await queryInterface.addIndex("views", ["browser_name"], {
    name: "views_browser_name_idx",
  });

  // Index for analytics queries by operating system
  await queryInterface.addIndex("views", ["os_name"], {
    name: "views_os_name_idx",
  });

  // Index for geographic analytics queries
  await queryInterface.addIndex("views", ["country"], {
    name: "views_country_idx",
  });

  // Index for sorting views by creation date
  await queryInterface.addIndex("views", ["created_at"], {
    name: "views_created_at_idx",
  });

  // Unique constraint to ensure one IP address can only view the same content once
  await queryInterface.addIndex("views", ["content_id", "ip_address"], {
    unique: true,
    name: "views_content_ip_unique_idx",
  });

  // Composite index for content analytics and reporting queries
  await queryInterface.addIndex("views", ["content_id", "created_at"], {
    name: "views_content_analytics_idx",
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("views");
}
