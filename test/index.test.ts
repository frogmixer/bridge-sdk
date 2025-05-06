import { bridge} from "../src";
test("major test", async () => {
  const b = new bridge({
    keys:[
    ]
  })
  await b.init()
  // console.log(
  //     b.estimate(
  //       {
  //         from:"SOL",
  //         to:"TON",
  //         amount:0.01
  //       }
  //     )
  // )
  // console.log(
  //   await b.bridge(
  //     {
  //       from:"SOL",
  //       to:"TON",
  //       toAddress:"",
  //       amount:0.01,
  //       type:"float",
  //       refcode:"nsvhdzsa",
  //       afftax:0.2
  //     }
  //   )
  // )

    
  return 0;
})