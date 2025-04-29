import { bridge} from "../src";
test("major test", async () => {
  const b = new bridge()
  await b.init()
  console.log(
      b.estimate(
        {
          from:"TON",
          to:"BTC",
          amount:100
        }
      )
  )
  return 0;
})