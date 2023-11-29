require("dotenv").config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  PRODUCTS_TABLE,
  IS_OFFLINE,
  LOCAL_DB_REGION,
  LOCAL_DB_ENDPOINT,
  LOCAL_DB_ACCESS_KEY_ID,
  LOCAL_DB_SECRET_ACCESS_KEY,
} = process.env;

const isOffline = IS_OFFLINE === "true";
const dynamoClientArgs = isOffline
  ? {
      region: LOCAL_DB_REGION,
      endpoint: LOCAL_DB_ENDPOINT,
      credentials: {
        accessKeyId: LOCAL_DB_ACCESS_KEY_ID,
        secretAccessKey: LOCAL_DB_SECRET_ACCESS_KEY,
      },
    }
  : {};

const client = new DynamoDBClient(dynamoClientArgs);
const dynamoDbClient = DynamoDBDocumentClient.from(client);

const getAllProducts = async () => {
  const params = {
    TableName: PRODUCTS_TABLE,
  };

  const { Items } = await dynamoDbClient.send(new ScanCommand(params));
  return { Items };
};

const getProductById = async (id) => {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: {
      productId: id,
    },
  };

  const { Item } = await dynamoDbClient.send(new GetCommand(params));
  return { Item };
};

const addProduct = async (productDetails) => {
  const { productId, title, price, imageUrl } = productDetails;

  const params = {
    TableName: PRODUCTS_TABLE,
    Item: {
      productId,
      title,
      imageUrl,
      priceMax: price,
      priceCurrent: price,
      dateCreated: new Date().toISOString(),
      dateRead: new Date().toISOString(),
      dateUpdated: "",
    },
    ConditionExpression: "attribute_not_exists(productId)",
  };

  try {
    return await dynamoDbClient.send(new PutCommand(params));
  } catch (error) {
    throw error;
  }
};

const updateProduct = async (productDetails, shouldUpdatePrice = false) => {
  const { productId, price } = productDetails;
  const nowString = new Date().toISOString();

  const expAssignments = {
    priceCurrent: "priceCurrent = :priceCurrent",
    dateRead: "dateRead = :dateRead",
    dateUpdated: "dateUpdated = :dateUpdated",
  };

  const updateExpString = shouldUpdatePrice
    ? `set ${Object.values(expAssignments).join(", ")}`
    : `set ${expAssignments.dateRead}`;

  const expAttributeValues = shouldUpdatePrice
    ? {
        ":priceCurrent": price,
        ":dateRead": nowString,
        ":dateUpdated": nowString,
      }
    : {
        ":dateRead": nowString,
      };

  const params = {
    TableName: PRODUCTS_TABLE,
    Key: {
      productId,
    },
    UpdateExpression: updateExpString,
    ExpressionAttributeValues: expAttributeValues,
    ConditionExpression: "attribute_exists(productId)",
  };

  try {
    return await dynamoDbClient.send(new UpdateCommand(params));
  } catch (error) {
    throw error;
  }
};

const deleteProductById = async (productId) => {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: {
      productId,
    },
  };

  try {
    return await dynamoDbClient.send(new DeleteCommand(params));
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProductById,
};
