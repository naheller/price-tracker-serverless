const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");

const {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProductById,
} = require("./db");
const { getProductDetailsCamel } = require("./scraper");
const { amazonAsinRegex } = require("./utils");
const { addToQueue2 } = require("./queueActions");
const { sendTestAlert } = require("./mailer");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/products", async function (req, res) {
  try {
    const { Items } = await getAllProducts();
    if (Items) {
      res.status(200).json({ products: Items });
    } else {
      res.status(404).json({ error: "Could not find any products" });
    }
  } catch (error) {
    res.status(500).json({ error: "Could not fetch products", details: error });
  }
});

app.get("/products/:productId", async function (req, res) {
  try {
    const { Item } = await getProductById(req.params.productId);

    if (Item) {
      const {
        productId,
        title,
        imageUrl,
        priceMax,
        priceCurrent,
        dateCreated,
        dateUpdated,
      } = Item;
      res.status(200).json({
        productId,
        title,
        imageUrl,
        priceMax,
        priceCurrent,
        dateCreated,
        dateUpdated,
      });
    } else {
      res
        .status(404)
        .json({ error: "Could not find product with provided product id" });
    }
  } catch (error) {
    res.status(500).json({
      error: "Could not fetch product",
      details: error?.message || error,
    });
  }
});

app.post("/products", async function (req, res) {
  const { url } = req.body;

  if (url === "") {
    res.status(400).json({ error: "URL must not be empty" });
  }

  if (typeof url !== "string") {
    res.status(400).json({ error: "URL must be a string" });
  }

  if (!amazonAsinRegex.test(url)) {
    res.status(400).json({ error: "URL does not contain an ASIN" });
  }

  let productDetails = {};

  try {
    productDetails = await getProductDetailsCamel(url);
  } catch (error) {
    res.status(500).json({
      error: "Could not retrieve product details",
      errorDetails: error?.message || error,
      productDetails,
    });
    return;
  }

  try {
    const response = await addProduct(productDetails);
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      error: "Could not create product",
      errorDetais: error?.message || error,
      productDetails,
    });
  }
});

app.put("/products", async function (req, res) {
  const { url } = req.body;

  if (url === "") {
    res.status(400).json({ error: "URL must not be empty" });
  }

  if (typeof url !== "string") {
    res.status(400).json({ error: "URL must be a string" });
  }

  if (!amazonAsinRegex.test(url)) {
    res.status(400).json({ error: "URL does not contain an ASIN" });
  }

  let productDetails = {};

  try {
    productDetails = await getProductDetailsCamel(url);
  } catch (error) {
    res.status(500).json({
      error: "Could not retrieve product details",
      errorDetails: error?.message || error,
      productDetails,
    });
    return;
  }

  try {
    const response = await updateProduct(productDetails);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      error: "Could not update product",
      errorDetais: error?.message || error,
      productDetails,
    });
  }
});

app.delete("/products/:productId", async function (req, res) {
  try {
    const response = await deleteProductById(req.params.productId);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      error: "Could not delete product",
      details: error?.message || error,
    });
  }
});

app.get("/queue/addAllProducts", async function (req, res) {
  try {
    const products = await addToQueue2();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      error: "Could not add all products to queue",
      details: error?.message || error,
    });
  }
});

app.get("/mailer/test", async function (req, res) {
  try {
    sendTestAlert();
    res.status(200);
  } catch (error) {
    res.status(500).json({
      error: "Error sending test email",
      details: error?.message || error,
    });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
