// src/publisher.js
// const AWS = require('aws-sdk');
// const sqs = new AWS.SQS({
//     apiVersion: 'latest',
//     region: process.env.AWS_REGION,
// });
const { 
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  DeleteMessageBatchCommand, } = require("@aws-sdk/client-sqs");

const { getAllProducts, updateProduct } = require("./db");
const { getProductDetailsCamel } = require("./scraper");
const { getAmazonUrlFromAsin } = require("./utils");
const { sendAlertSingle, sendErrorAlertSingle } = require("./mailer");

const client = new SQSClient({});
const { SQS_QUEUE_URL } = process.env;

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const addToQueue = async () => {
  console.log('---addToQueue---')
  const command = new SendMessageCommand({
    QueueUrl: SQS_QUEUE_URL,
    MessageGroupId: "Product",
    MessageDeduplicationId: "Product",
    MessageAttributes: {
      Title: {
        DataType: "String",
        StringValue: "The Whistler",
      },
      Author: {
        DataType: "String",
        StringValue: "John Grisham",
      },
      WeeksOn: {
        DataType: "Number",
        StringValue: "6",
      },
    },
    MessageBody:
      "Information about current NY Times fiction bestseller for week of 12/11/2016.",
  });

  const response = await client.send(command);
  console.log('response', response);
  return response;
}

const addToQueue2 = async () => {
  console.log('---addToQueue2---')
  let products = [];

  try {
    const { Items } = await getAllProducts();
    if (Items) {
      products = Items;
    }
  } catch (error) {
    console.log(error);
    return;
  }

  for (const product of products) {
    console.log('sending message for', product.title)
    const messageBodyObj = {
      productId: product.productId,
      title: product.title,
      priceCurrent: product.priceCurrent,
      priceMax: product.priceMax,
    };

    const command = new SendMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      // MessageGroupId: "Product",
      // MessageDeduplicationId: product.productId,
      // MessageAttributes: {
      //   Title: {
      //     DataType: "String",
      //     StringValue: product.title,
      //   },
      //   ProductId: {
      //     DataType: "String",
      //     StringValue: product.productId,
      //   },
      //   PriceCurrent: {
      //     DataType: "Number",
      //     StringValue: `${product.priceCurrent}`,
      //   },
      //   PriceMax: {
      //     DataType: "Number",
      //     StringValue:`${product.priceMax}`,
      //   },
      // },
      MessageBody: JSON.stringify(messageBodyObj),
    });

    try {
      const response = await client.send(command);
      console.log('response', response)
    } catch (e) {
      console.log('error', e)
    }
  }

  return products;
}

const receiveMessage = (queueUrl) => (
  client.send(
    new ReceiveMessageCommand({
      AttributeNames: ["All"],
      MaxNumberOfMessages: 1,
      MessageAttributeNames: ["All"],
      QueueUrl: queueUrl,
      // WaitTimeSeconds: 20,
      // VisibilityTimeout: 20,
    }),
  )
);

const processQueueItem = async () => {
  console.log('---processQueueItem---')
  // const { Messages } = await receiveMessage(SQS_QUEUE_URL);
  let response = {};

  try {
    response = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        AttributeNames: ["All"],
        MessageAttributeNames: ["All"],
        MaxNumberOfMessages: 1,
        // WaitTimeSeconds: 60,
        // VisibilityTimeout: 60,
      }),
    );
    console.log('response', response)
  } catch (e) {
    console.log('error', e)
  }

  const { Messages } = response;

  if (!Messages) {
    console.log('no messages property in response at all! returning')
    return;
  }

  if (Messages.length === 1) {
    console.log('Messages[0].Body', Messages[0].Body);
    console.log('deleting 1 message')
    await client.send(
      new DeleteMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        ReceiptHandle: Messages[0].ReceiptHandle,
      }),
    );
  } else if (Messages.length > 1) {
    console.log('deleting multiple messages')
    await client.send(
      new DeleteMessageBatchCommand({
        QueueUrl: SQS_QUEUE_URL,
        Entries: Messages.map((message) => ({
          Id: message.MessageId,
          ReceiptHandle: message.ReceiptHandle,
        })),
      }),
    );
  } else {
    console.log('empty messages. returning.')
    return;
  }
};

const processQueueItem2 = async (event) => {
  console.log('--processQueueItem2--')
  // console.log('event', event)
  if (!event?.Records.length) {
    return;
  }

  console.log('total records:', event.Records.length)
  const record = event.Records[0];

  // for (const record of event.Records) {
  // event.Records.forEach(async record => {
    const { body } = record;
    const oldProductDetails = JSON.parse(body);
    const cleanUrl = getAmazonUrlFromAsin(oldProductDetails.productId);
    console.log('body', body);
    // console.log('parsedBody', parsedBody);
    let newProductDetails = {};
    
    try {
      newProductDetails = await getProductDetailsCamel(cleanUrl);
      console.log('newProductDetails', newProductDetails)
    } catch (error) {
      console.log('error getting newProductDetails', error);
      sendErrorAlertSingle(oldProductDetails.title);
    }

    const newPrice = newProductDetails?.price;
    const oldPrice = oldProductDetails?.priceCurrent;
    const maxPrice = oldProductDetails?.priceMax;

    console.log('newPrice', newPrice)
    console.log('oldPrice', oldPrice)
    console.log('maxPrice', maxPrice)

    if (newPrice < maxPrice && newPrice < oldPrice) {
      console.log('found lower price. alerting.')
      sendAlertSingle({
        title: newProductDetails.title,
        url: cleanUrl,
        newPrice,
        oldPrice,
      });
    }

    if (newPrice !== oldPrice) {
      console.log('updating product price')
      try {
        await updateProduct(newProductDetails);
      } catch (error) {
        console.log(error);
        // break;
      }
    }
  // };
  // await sleep(2000);
  return {};
};

module.exports = { addToQueue, addToQueue2, processQueueItem, processQueueItem2 };
