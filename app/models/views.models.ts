import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import Content from "./content.models";

// Define device types
export type TDeviceType = "desktop" | "mobile" | "tablet" | "unknown";

// View attributes interface
interface ViewAttributes {
  id: string;
  contentId: string;
  ipAddress: string;
  browserName: string | null;
  browserVersion: string | null;
  deviceType: TDeviceType | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  osName: string | null;
  osVersion: string | null;
  screenResolution: string | null;
  country: string | null;
  city: string | null;
  userAgent: string | null;
  referrer: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Attributes for view creation
interface ViewCreationAttributes
  extends Optional<
    ViewAttributes,
    | "id"
    | "browserName"
    | "browserVersion"
    | "deviceType"
    | "deviceBrand"
    | "deviceModel"
    | "osName"
    | "osVersion"
    | "screenResolution"
    | "country"
    | "city"
    | "userAgent"
    | "referrer"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

export class View
  extends Model<ViewAttributes, ViewCreationAttributes>
  implements ViewAttributes
{
  public id!: string;
  public contentId!: string;
  public ipAddress!: string;
  public browserName!: string | null;
  public browserVersion!: string | null;
  public deviceType!: TDeviceType | null;
  public deviceBrand!: string | null;
  public deviceModel!: string | null;
  public osName!: string | null;
  public osVersion!: string | null;
  public screenResolution!: string | null;
  public country!: string | null;
  public city!: string | null;
  public userAgent!: string | null;
  public referrer!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  // Define associations
  public readonly content?: Content;
}

View.init(
  {
    // Primary key identifier for the view record
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // Foreign key reference to the content that was viewed
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
    // IP address of the viewer (IPv6 support with 45 characters)
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    // Name of the browser (e.g., "Chrome", "Firefox", "Safari")
    browserName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Version of the browser (e.g., "118.0", "119.0.1")
    browserVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Type of device used to view the content
    deviceType: {
      type: DataTypes.ENUM("desktop", "mobile", "tablet", "unknown"),
      allowNull: true,
    },
    // Brand of the device (e.g., "Apple", "Samsung", "Google")
    deviceBrand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Model of the device (e.g., "iPhone 15", "Galaxy S23", "MacBook Pro")
    deviceModel: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Name of the operating system (e.g., "iOS", "Android", "Windows", "macOS")
    osName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Version of the operating system (e.g., "17.1", "14.0", "11")
    osVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Screen resolution of the device (e.g., "1920x1080", "390x844")
    screenResolution: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
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
    // Complete user agent string for detailed analysis
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // URL of the page that referred the user to this content
    referrer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Timestamp when the view was recorded
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // Timestamp when the view record was last updated
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
    tableName: "views",
    timestamps: true,
    paranoid: true, // Enables soft deletes
    underscored: true, // This will convert camelCase to snake_case in DB
    indexes: [
      {
        name: "views_content_id_idx",
        fields: ["content_id"],
      },
      {
        name: "views_ip_address_idx",
        fields: ["ip_address"],
      },
      {
        name: "views_device_type_idx",
        fields: ["device_type"],
      },
      {
        name: "views_browser_name_idx",
        fields: ["browser_name"],
      },
      {
        name: "views_os_name_idx",
        fields: ["os_name"],
      },
      {
        name: "views_country_idx",
        fields: ["country"],
      },
      {
        name: "views_created_at_idx",
        fields: ["created_at"],
      },
      {
        name: "views_content_ip_unique_idx",
        fields: ["content_id", "ip_address"],
        unique: true,
      },
      {
        name: "views_content_analytics_idx",
        fields: ["content_id", "created_at"],
      },
    ],
  },
);

// Define associations
View.belongsTo(Content, {
  foreignKey: "contentId",
  as: "content",
});

Content.hasMany(View, {
  foreignKey: "contentId",
  as: "views",
});

export default View;
