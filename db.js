const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

const client = new DynamoDBClient();
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
  const { productId, title, price } = productDetails;

  const params = {
    TableName: PRODUCTS_TABLE,
    Item: {
      productId,
      title,
      price,
    },
    ConditionExpression: "attribute_not_exists(productId)",
  };

  return await dynamoDbClient.send(new PutCommand(params));
};

module.exports = { getAllProducts, getProductById, addProduct };
