const { getProductDetailsCamel } = require("./scraper");

const test = async () => {
  const url =
    "https://www.amazon.com/Midnight-Peking-Murder-Englishwoman-Haunted-ebook/dp/B0072NWJRK/ref=tmm_kin_swatch_0?_encoding=UTF8&qid=&sr=";
  const productDetails = await getProductDetailsCamel(url);
  console.log(productDetails);
};

test();
